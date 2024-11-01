![Image](app/src/assets/img/datagerry_logo.svg)
DATAGERRY is an OpenSource CMDB & Asset Management Tool, which completely leaves the definition of a data model to the user.

Key Functions:
* Define your own object types (e.g. router, server, location) in a simple webfrontend
* Add objects manually or import them from a CSV, Excel, XML, JSON file
* Define automated exports to external systems (e.g. Monitoring Systems, Config Management, Backup, Ticket Systems, DNS, ...)
* Use one of our APIs to integrate your systems
* ...and many many more features on the roadmap - we just started

Key Facts:
* Define your own data model
* Automate your IT with exporting assets to external systems
* OpenSource (AGPLv3)

See [DATAGERRY website](https://www.datagerry.com) for more details!


## Getting Started
|Useful Links |
|-----|
|[Getting Started](https://www.datagerry.com) |
|[Documentation](https://docs.datagerry.com)|
|[Issue Tracker](https://issues.datagerry.com)|
|[Community Support](https://community.datagerry.com)|


## Continous Integration
| Service        | development      | master       |
| -------------- |----------------- | ------------ |
| Github Actions | ![Continous Integration](https://github.com/DATAGerry/DATAGerry/workflows/Continous%20Integration/badge.svg?branch=development) | ![Continous Integration](https://github.com/DATAGerry/DATAGerry/workflows/Continous%20Integration/badge.svg?branch=master) |


## Packaging the Code for Sopris Modifications

When Sopris modifies the DATAGerry code, we use the `make rpm` command to package the software in RPM format. This packaging process, which prepares the code for distribution, installation, and updates, is compatible with Linux-based systems like CentOS and Red Hat.

### dependencies.sh: Installing Required Dependencies (One-Time Setup)

To support the `make rpm` packaging process, we created a script called dependencies.sh, which installs all the necessary dependencies for `make rpm` to function. These dependencies only need to be installed once on each environment where the packaging process will be executed.

#### Location of the Script

The `dependencies.sh` script is available in the root folder of this repository.

### Workflow for Code Modifications by Sopris

The workflow for making and packaging code modifications is as follows:

1. Make the necessary code modifications.
2. Run the `dependencies.sh` script to install dependencies (one-time setup).
3. Package the code using the make rpm command.
4. Deploy the packaged code.
