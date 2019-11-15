'''
def setUpModule():
    """ runs once per module """
    pass


def teardownModule():
    """ runs once per module """
    pass


#@django.test.override_settings(...)
class TestCase(django.test.TestCase):
    @classmethod
    def setUpClass(cls):
        """ runs once per class """
        super().setUpClass()
        # setup tasks go here

    @classmethod
    def tearDownClass(cls):
        """ runs once per class """
        # teardown tasks go here
        super().tearDownClass()

    @classmethod
    def setUpTestData(cls):
        """  runs per class if transaction support, otherwise per method """
        # "Modifications to in-memory objects from setup work done at the class level will persist between test methods"
        # I think this means that the DB doesn't change (transaction rollbacks) but references to the same object will be the same
        pass

    def setUp(self):
        """ runs once per method """
        pass

    def tearDown(self):
        """ runs once per method """
        pass

    def test_homepage(self):
        c = django.test.Client
        c.get('/')


class SimpleTestCase(django.test.testcases.SimpleTestCase):
    """
    Simple test case
    - no transactions -- but DB queries allowed

    """
    pass


#
# Run order:
# 1) TestCase & descendants
# 2) all other SimpleTestCase & descendants
# 3) all other unittest.TestCase & descendants
#
#
#
# unittest.TestCase - base functionality
#   django.tests.testcases.SimpleTestCase - disallows DB queries
#     django.tests.testcases.TransactionTestCase - no migration data (unless you set serialized_rollback=True), fixture data
#       django.tests.testcases.TestCase - has access to migration data; transaction around each class and each method
#       django.tests.testcases.LiveServerTestCase - runs a web server on setUp
#         django.tests.testcases.StaticLiveServerTestCase
#
# - can run with modified settings
# - records sent email
# - various assertions
# - tagging tests
# - loading of fixtures
'''
