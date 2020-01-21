try:
    from setuptools import setup
except ImportError:
    from distutils.core import setup

setup(
    name="presto_viewmodels_drf",
    version="0.0.1",
    author="Alliance Software",
    author_email="support@alliancesoftware.com.au",
    packages=["presto_viewmodels_drf"],  # this must be the same as the name above
    include_package_data=True,
    description="Export serializer information for consumption by codegen",
    # long_description=...,
    # license='??',
    install_requires=["djangorestframework >= 3.8",],
    url="https://gitlab.internal.alliancesoftware.com.au/alliance/presto",
    classifiers=[],
    keywords=["rad", "rapid application development", "drf", "rest", "django"],
    python_requires=">=3.6",
)