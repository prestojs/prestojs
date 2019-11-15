import contextlib
import os
import tempfile
from unittest.mock import patch

from django.apps import apps
from django.test import override_settings
from django.test import TestCase

import csv_permissions.permissions
from xenopus_frog.models import AdminProfile
from xenopus_frog.models import CustomerProfile
from xenopus_frog.tests.factory import AdminFactory
from xenopus_frog.tests.factory import CustomerFactory

USER1_MODEL = CustomerProfile
USER1_TYPE = CustomerProfile.user_type

USER2_MODEL = AdminProfile
USER2_TYPE = AdminProfile.user_type


@contextlib.contextmanager
def override_csv_permissions(csv_data):
    csv_file = None
    try:
        with tempfile.NamedTemporaryFile("w", delete=False) as csv_file:
            csv_file.writelines(csv_data)

        with override_settings(CSV_PERMISSIONS_PATH=csv_file.name):
            yield

    finally:
        if csv_file is not None:
            os.remove(csv_file.name)


class CsvRulesTests(TestCase):
    def test_permissions_parse(self):
        """
        Does not test implementations of individual permissions functions, only that they have been loaded correctly
        from the CSV. yes/no/all have fixed return values, whereas own/custom functions are defined in rules.py.
        """

        csv_data = f"""
        Entity,     Module,               Action, Is Global,    {USER1_TYPE}, {USER2_TYPE},
        TestModelA, test_csv_permissions, detail,   no,           all,           own: model_a,
        TestModelB, test_csv_permissions, change,   no,           own,           ,
        TestModelC, test_csv_permissions, detail,   no,           all,           all,
        TestModelD, test_csv_permissions, list,   yes,          ,              yes,
        TestModelE, test_csv_permissions, change,   no,           own: model_e,  custom: own_model_a_or_model_b,
        """.strip()

        with override_csv_permissions(csv_data):
            user1 = CustomerFactory(email="user1@localhost.test",)
            user2 = AdminFactory(email="user2@localhost.test",)

            expected_results = (
                # (model, permission, pass_model, has_perm(USER1)?, has_perm(USER2)? )
                (
                    "TestModelA",
                    "test_csv_permissions.detail_testmodela",
                    True,
                    True,
                    True,
                ),
                (
                    "TestModelB",
                    "test_csv_permissions.change_testmodelb",
                    True,
                    True,
                    False,
                ),
                (
                    "TestModelC",
                    "test_csv_permissions.detail_testmodelc",
                    True,
                    True,
                    True,
                ),
                (
                    "TestModelD",
                    "test_csv_permissions.list_testmodeld",
                    False,
                    False,
                    True,
                ),
                (
                    "TestModelE",
                    "test_csv_permissions.change_testmodele",
                    True,
                    True,
                    False,
                ),
            )

            for (
                entity,
                code_name,
                pass_model,
                user1_has_perm,
                user2_has_perm,
            ) in expected_results:
                if pass_model:
                    test_obj = apps.get_model(
                        "test_csv_permissions", entity
                    ).objects.create()
                else:
                    test_obj = None

                with self.subTest(code_name=code_name, entity=entity):
                    self.assertEqual(
                        user1_has_perm,
                        user1.has_perm(code_name, test_obj),
                        "Unexpected permission mismatch for user1",
                    )

                    self.assertEqual(
                        user2_has_perm,
                        user2.has_perm(code_name, test_obj),
                        "Unexpected permission mismatch for user2",
                    )

    def test_all_global_permission_error(self):
        csv_data = f"""
        Entity,     Module,               Action, Is Global,    {USER1_TYPE},
        TestModelA, test_csv_permissions, detail,   yes,          all,
        """.strip()

        with override_csv_permissions(csv_data):
            user = CustomerFactory(email="user@localhost.test",)

            with self.assertRaises(RuntimeError):
                user.has_perm("test_csv_permissions.detail_testmodela")

    def test_own_global_permission_error(self):
        csv_data = f"""
        Entity,     Module,               Action, Is Global,    {USER1_TYPE},
        TestModelA, test_csv_permissions, detail,   yes,          own,
        """.strip()

        with override_csv_permissions(csv_data):
            user = CustomerFactory(email="user@localhost.test",)

            with self.assertRaises(RuntimeError):
                user.has_perm("test_csv_permissions.detail_testmodela")

    def test_yes_object_permission_error(self):
        csv_data = f"""
        Entity,     Module,               Action, Is Global,    {USER1_TYPE},
        TestModelA, test_csv_permissions, detail,   no,           yes,
        """.strip()

        with override_csv_permissions(csv_data):
            user = CustomerFactory(email="user@localhost.test",)

            with self.assertRaises(RuntimeError):
                user.has_perm("test_csv_permissions.detail_testmodela")

    def test_non_existent_permission_error(self):
        """
        Test that permissions that aren't present in the file return false rather than raising an error
        if tested against a user.
        """
        csv_data = f"""
        Entity,     Module,               Action, Is Global,    {USER1_TYPE},
        TestModelA, test_csv_permissions, detail,   no,          own,
        """.strip()

        with override_csv_permissions(csv_data):
            user = CustomerFactory(email="user@localhost.test",)

            self.assertEqual(
                user.has_perm("test_csv_permissions.nonexistentperm_detail"), False
            )

    def test_empty_file_permission_error(self):
        csv_data = f"""
        Entity,     Module,               Action, Is Global,    {USER1_TYPE},
        """.strip()

        with override_csv_permissions(csv_data):
            user = CustomerFactory(email="user@localhost.test",)

            with self.assertRaisesMessage(RuntimeError, "Empty permissions file"):
                user.has_perm("test_csv_permissions.testmodelb_detail")

    def test_misconfigured_global_permission_error(self):
        """
        Test that a permission which should be object level, raises an error if configured as a global permission.
        """
        csv_data = f"""
        Entity,     Module,               Action, Is Global,    {USER1_TYPE},
        TestModelA, test_csv_permissions, detail,   yes,          own,
        """.strip()

        with override_csv_permissions(csv_data):
            user = CustomerFactory(email="user@localhost.test",)

            with self.assertRaisesMessage(
                RuntimeError,
                "Invalid action / global combination for detail_testmodela",
            ):
                user.has_perm("test_csv_permissions.detail_testmodela")

    def test_misconfigured_object_permission_error(self):
        """
        Test that a permission which should be global level, raises an error if configured as a object permission.
        """
        csv_data = f"""
        Entity,     Module,               Action, Is Global,    {USER1_TYPE},
        TestModelA, test_csv_permissions, list,   no,          yes,
        """.strip()

        with override_csv_permissions(csv_data):
            user = CustomerFactory(email="user@localhost.test",)

            with self.assertRaisesMessage(
                RuntimeError, "Invalid action / global combination for list_testmodela"
            ):
                user.has_perm("test_csv_permissions.detail_testmodela")

    @patch(
        "csv_permissions.permissions._access_level_all",
        wraps=csv_permissions.permissions._access_level_all,
    )
    def test_all_permission(self, access_level_all_mock):
        csv_data = f"""
        Entity,     Module,               Action, Is Global,    {USER1_TYPE},
        TestModelA, test_csv_permissions, detail,   no,           all,
        """.strip()

        with override_csv_permissions(csv_data):
            user = CustomerFactory(email="user@localhost.test",)

            with self.assertRaises(RuntimeError):
                user.has_perm("test_csv_permissions.detail_testmodela", None)

            self.assertEqual(
                1,
                access_level_all_mock.call_count,
                "All function should have been called once",
            )

            test_obj = apps.get_model(
                "test_csv_permissions", "TestModelA"
            ).objects.create()
            self.assertTrue(
                user.has_perm("test_csv_permissions.detail_testmodela", test_obj),
                "User should have access to all objects",
            )

            self.assertEqual(
                2,
                access_level_all_mock.call_count,
                "All function should have been called twice",
            )

    @patch(
        "csv_permissions.permissions._access_level_yes",
        wraps=csv_permissions.permissions._access_level_yes,
    )
    def test_yes_permission(self, access_level_yes_mock):
        csv_data = f"""
        Entity,     Module,               Action, Is Global,    {USER2_TYPE},
        TestModelD, test_csv_permissions, list,    yes,          yes,
        """.strip()

        with override_csv_permissions(csv_data):
            user = USER2_MODEL.objects.create_user(email="user@localhost.test",)

            self.assertTrue(
                user.has_perm("test_csv_permissions.list_testmodeld", None),
                "User should have access with no object",
            )

            self.assertEqual(
                1,
                access_level_yes_mock.call_count,
                "Yes function should have been called once",
            )

            test_obj = apps.get_model(
                "test_csv_permissions", "TestModelD"
            ).objects.create()
            with self.assertRaises(RuntimeError):
                user.has_perm("test_csv_permissions.list_testmodeld", test_obj)

            self.assertEqual(
                2,
                access_level_yes_mock.call_count,
                "Yes function should have been called twice",
            )

    @patch(
        "csv_permissions.permissions._access_level_no",
        wraps=csv_permissions.permissions._access_level_no,
    )
    def test_no_permission(self, access_level_no_mock):
        csv_data = f"""
        Entity,     Module,               Action, Is Global,    {USER1_TYPE},
        TestModelD, test_csv_permissions, list,   yes,          ,
        """.strip()

        with override_csv_permissions(csv_data):
            user = CustomerFactory(email="user@localhost.test",)

            self.assertFalse(
                user.has_perm("test_csv_permissions.list_testmodeld", None),
                "User should not have access with no object",
            )

            self.assertEqual(
                1,
                access_level_no_mock.call_count,
                "No function should have been called once",
            )

            test_obj = apps.get_model(
                "test_csv_permissions", "TestModelD"
            ).objects.create()
            self.assertFalse(
                user.has_perm("test_csv_permissions.list_testmodeld", test_obj),
                "User should not have access with no object",
            )

            self.assertEqual(
                2,
                access_level_no_mock.call_count,
                "No function should have been called twice",
            )

    @patch(
        "csv_permissions.permissions._access_level_own",
        wraps=csv_permissions.permissions._access_level_own,
    )
    def test_own_permission(self, access_level_own_mock):
        csv_data = f"""
        Entity,     Module,               Action, Is Global,    {USER2_TYPE},
        TestModelA, test_csv_permissions, detail,   no,           own: model_a,
        """.strip()

        with override_csv_permissions(csv_data):
            user = AdminFactory(email="user@localhost.test",)

            with self.assertRaises(RuntimeError):
                user.has_perm("test_csv_permissions.detail_testmodela", None)

            self.assertEqual(
                1,
                access_level_own_mock.call_count,
                "Own function should have been called once",
            )

            test_obj = apps.get_model(
                "test_csv_permissions", "TestModelA"
            ).objects.create()
            self.assertTrue(
                user.has_perm("test_csv_permissions.detail_testmodela", test_obj),
                "User should have access to all objects",
            )

            self.assertEqual(
                2,
                access_level_own_mock.call_count,
                "Own function should have been called twice",
            )

    @patch(
        "csv_permissions.permissions._access_level_custom",
        wraps=csv_permissions.permissions._access_level_custom,
    )
    def test_custom_permission(self, access_level_custom_mock):
        csv_data = f"""
        Entity,     Module,               Action, Is Global,    {USER2_TYPE},
        TestModelE, test_csv_permissions, change,   no,           custom: own_model_a_or_model_b,
        """.strip()

        with override_csv_permissions(csv_data):
            user = USER2_MODEL.objects.create_user(email="user@localhost.test",)

            self.assertFalse(
                user.has_perm("test_csv_permissions.change_testmodele", None),
                "User should not have access with no object",
            )

            self.assertEqual(
                1,
                access_level_custom_mock.call_count,
                "Custom function should have been called once",
            )

            test_obj = apps.get_model(
                "test_csv_permissions", "TestModelE"
            ).objects.create()
            self.assertFalse(
                user.has_perm("test_csv_permissions.change_testmodele", test_obj),
                "User should not have access to a specific object",
            )

            self.assertEqual(
                2,
                access_level_custom_mock.call_count,
                "Custom function should have been called twice",
            )
