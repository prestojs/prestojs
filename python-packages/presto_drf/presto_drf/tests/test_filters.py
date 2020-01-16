from django.test import SimpleTestCase
from django_filters.fields import ChoiceField
from django_filters.fields import ModelChoiceField
from django_filters.fields import ModelMultipleChoiceField

from presto_drf.filters import RefineLookupChoiceFilter


class TestRefineLookupChoiceFilter(SimpleTestCase):
    def test_refine_lookup_choice_filter_field_classes(self):
        with self.assertRaisesMessage(
            ValueError,
            "field_class must be one of ModelChoiceField, ModelMultipleChoiceField",
        ):
            RefineLookupChoiceFilter(refine_choices=lambda qs, **kwargs: qs)

        with self.assertRaisesMessage(
            ValueError,
            "field_class must be one of ModelChoiceField, ModelMultipleChoiceField",
        ):
            RefineLookupChoiceFilter(
                field_class=ChoiceField, refine_choices=lambda qs, **kwargs: qs
            )

        RefineLookupChoiceFilter(
            field_class=ModelChoiceField, refine_choices=lambda qs, **kwargs: qs
        )

        RefineLookupChoiceFilter(
            field_class=ModelMultipleChoiceField, refine_choices=lambda qs, **kwargs: qs
        )
