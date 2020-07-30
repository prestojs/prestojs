import io

from django.core.files.uploadhandler import MemoryFileUploadHandler
from django.test import SimpleTestCase

from presto_drf.parsers import CamelCaseJSONParser
from presto_drf.parsers import CamelCaseMultiPartJSONParser


class TestParsers(SimpleTestCase):
    def bytes(self, value):
        return io.BytesIO(value.encode())

    def test_camel_case_json_parser(self):
        parser = CamelCaseJSONParser()
        result = parser.parse(self.bytes('{"dataKeyFoo":{"innerKeyBar":1,"key":2}}'))
        self.assertEqual(result, {"data_key_foo": {"inner_key_bar": 1, "key": 2}})

        # Numbers in keys were problematic with old djangorestframework_camel_case.parser.CamelCaseJSONParser
        # Test that we preserve whatever the input convetion was
        result = parser.parse(
            self.bytes('{"keyWithNumeric_1":{"keyWithNumeric2":1,"key":2}}')
        )
        self.assertEqual(
            result, {"key_with_numeric_1": {"key_with_numeric2": 1, "key": 2}}
        )

    def test_camel_case_json_parser_underscorize_ignore(self):
        class CustomCamelCaseJSONRenderer(CamelCaseJSONParser):
            def underscoreize(self, data, **kwargs):
                return super().underscoreize(data, ignore=["*", "*.dEf.hIj"], **kwargs)

        parser = CustomCamelCaseJSONRenderer()
        result = parser.parse(self.bytes('{"aBc": {"dEf": {"hIj": {"kLm": "nOp"}}}}'))
        self.assertEqual(result, {"aBc": {"d_ef": {"hIj": {"k_lm": "nOp"}}}})

    def test_camel_case_multi_part_parser(self):
        s = """------test_boundary
Content-Disposition: form-data; name="jsonData"\r\n\r\n{"keyWithNumeric_1":{"keyWithNumeric2":1,"key":2}}"""

        class MockRequest:
            pass

        request = MockRequest()
        request.upload_handlers = (MemoryFileUploadHandler(),)
        request.META = {
            "CONTENT_LENGTH": len(s),
            "CONTENT_TYPE": "multipart/form-data; boundary=----test_boundary",
            "HTTP_X_MULTIPART_JSON": "1",
        }
        parser_context = {"request": request}
        parser = CamelCaseMultiPartJSONParser()
        r = self.bytes(s)
        r.META = request.META
        result = parser.parse(
            r,
            "multipart/form-data; boundary=----test_boundary",
            parser_context=parser_context,
        )
        self.assertEqual(
            result, {"key_with_numeric_1": {"key_with_numeric2": 1, "key": 2}}
        )

    def test_camel_case_multi_part_parser_underscoreize_ignore(self):
        s = """------test_boundary
Content-Disposition: form-data; name="jsonData"\r\n\r\n{"aBc": {"dEf": {"hIj": {"kLm": "nOp"}}}}"""

        class MockRequest:
            pass

        request = MockRequest()
        request.upload_handlers = (MemoryFileUploadHandler(),)
        request.META = {
            "CONTENT_LENGTH": len(s),
            "CONTENT_TYPE": "multipart/form-data; boundary=----test_boundary",
            "HTTP_X_MULTIPART_JSON": "1",
        }
        parser_context = {"request": request}

        class CustomCamelCaseJSONRenderer(CamelCaseMultiPartJSONParser):
            def underscoreize(self, data, **kwargs):
                return super().underscoreize(data, ignore=["*", "*.dEf.hIj"], **kwargs)

        parser = CustomCamelCaseJSONRenderer()
        r = self.bytes(s)
        r.META = request.META
        result = parser.parse(
            r,
            "multipart/form-data; boundary=----test_boundary",
            parser_context=parser_context,
        )
        self.assertEqual(result, {"aBc": {"d_ef": {"hIj": {"k_lm": "nOp"}}}})
