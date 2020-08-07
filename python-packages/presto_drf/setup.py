try:
    from setuptools import setup
except ImportError:
    from distutils.core import setup

with open("README.md", "r") as fh:
    long_description = fh.read()

setup(
    name="presto_drf",
    version="0.0.2",
    author="Alliance Software",
    author_email="support@alliancesoftware.com.au",
    packages=["presto_drf"],  # this must be the same as the name above
    include_package_data=True,
    description="Integration package for using django-rest-framework with prestojs",
    long_description=long_description,
    long_description_content_type="text/markdown",
    install_requires=["djangorestframework>=3.8"],
    url="https://github.com/prestojs/prestojs/",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    keywords=["rad", "rapid application development", "drf", "rest", "django"],
    python_requires=">=3.6",
)
