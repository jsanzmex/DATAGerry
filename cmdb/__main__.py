#!/usr/bin/env python
# dataGerry - OpenSource Enterprise CMDB
# Copyright (C) 2019 NETHINKS GmbH
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

"""
dataGerry is a flexible asset management tool and
open-source configurable management database
"""
import logging
import signal
from time import sleep
from argparse import ArgumentParser, Namespace
from cmdb.utils.logger import get_logging_conf
from cmdb.utils.helpers import timing
from sys import exit

try:
    from cmdb.utils.error import CMDBError
except ImportError:
    CMDBError = Exception

# setup logging for startup
logging.config.dictConfig(get_logging_conf())
LOGGER = logging.getLogger(__name__)


def _activate_debug():
    """
    Activate the debug mode
    """
    import cmdb
    cmdb.__MODE__ = 'DEBUG'
    LOGGER.warning("DEBUG mode enabled")


def _check_database():
    """
    Checks whether the specified connection of the configuration is reachable.
    Returns: True if response otherwise False

    """

    from cmdb.utils.system_reader import SystemConfigReader
    from cmdb.data_storage import get_pre_init_database
    LOGGER.info(f'Checking database connection with {SystemConfigReader.DEFAULT_CONFIG_NAME} data')
    dbm = get_pre_init_database()
    connection_test = dbm.database_connector.is_connected()
    LOGGER.debug(f'Database status is {connection_test}')
    if connection_test is True:
        dbm.database_connector.disconnect()
        return connection_test
    retries = 0
    while retries < 3:
        retries += 1
        LOGGER.warning(
            f'Retry {retries}: Checking database connection with {SystemConfigReader.DEFAULT_CONFIG_NAME} data')

        connection_test = dbm.database_connector.is_connected()
        if connection_test:
            dbm.database_connector.disconnect()
            return connection_test
    return connection_test


def _start_app():
    """
    Starting the services
    """
    import cmdb.process_management.process_manager

    global app_manager

    # install signal handler
    signal.signal(signal.SIGTERM, _stop_app)

    # start app
    app_manager = cmdb.process_management.process_manager.ProcessManager()
    app_status = app_manager.start_app()
    LOGGER.info(f'Process manager started: {app_status}')


def _stop_app(signum, frame):
    global app_manager
    app_manager.stop_app()


def _init_config_reader(config_file):
    import os

    from cmdb.utils.system_reader import SystemConfigReader
    path, filename = os.path.split(config_file)
    if filename is not SystemConfigReader.DEFAULT_CONFIG_NAME or path is not SystemConfigReader.DEFAULT_CONFIG_LOCATION:
        SystemConfigReader.RUNNING_CONFIG_NAME = filename
        SystemConfigReader.RUNNING_CONFIG_LOCATION = path + '/'
    SystemConfigReader(SystemConfigReader.RUNNING_CONFIG_NAME,
                       SystemConfigReader.RUNNING_CONFIG_LOCATION)


def build_arg_parser() -> Namespace:
    """
    Generate application parameter parser
    Returns: instance of OptionParser

    """

    from cmdb import __title__
    _parser = ArgumentParser(
        prog='dataGerry',
        usage="usage: {} [options]".format(__title__),
    )
    _parser.add_argument('--setup', action='store_true', default=False, dest='setup',
                         help="init cmdb")

    _parser.add_argument('--test', action='store_true', default=False, dest='test_data',
                         help="generate and insert test data")

    _parser.add_argument('-d', '--debug', action='store_true', default=False, dest='debug',
                         help="enable debug mode: DO NOT USE ON PRODUCTIVE SYSTEMS")

    _parser.add_argument('-s', '--start', action='store_true', default=False, dest='start',
                         help="starting cmdb core system - enables services")

    _parser.add_argument('-c', '--config', default='./etc/cmdb.conf', dest='config_file',
                         help="optional path to config file")

    return _parser.parse_args()


@timing('CMDB start took')
def main(args):
    """
    Default application start function
    Args:
        args: start-options
    """
    LOGGER.info("dataGerry starting...")
    if args.debug:
        _activate_debug()
    _init_config_reader(args.config_file)
    from cmdb.data_storage.database_connection import DatabaseConnectionError
    try:
        conn = _check_database()
        if not conn:
            raise DatabaseConnectionError()
        LOGGER.info("Database connection established.")
    except CMDBError as conn_error:
        LOGGER.critical(conn_error.message)
        exit(1)
    if args.setup:
        from cmdb.__setup__ import SetupRoutine
        setup_routine = SetupRoutine()
        setup_status = None
        try:
            setup_status = setup_routine.setup()
        except RuntimeError as err:
            LOGGER.error(err)
            setup_status = setup_routine.get_setup_status()
            LOGGER.warning(f'The setup did not go through as expected - Status {setup_status}')

        if setup_status == SetupRoutine.SetupStatus.FINISHED:
            exit(0)
        else:
            exit(1)

    if args.test_data:
        _activate_debug()
        from cmdb.utils.data_factory import DataFactory
        from cmdb.data_storage import get_pre_init_database

        _factory_database_manager = get_pre_init_database()
        db_name = _factory_database_manager.get_database_name()
        LOGGER.warning(f'Inserting test-data into: {db_name}')
        try:
            factory = DataFactory(database_manager=_factory_database_manager)
            ack = factory.insert_data()
            LOGGER.warning("Test-data was successfully added".format(_factory_database_manager.get_database_name()))
            if len(ack) > 0:
                LOGGER.critical("Error while inserting test-data: {} - dropping database".format(ack))
                _factory_database_manager.drop(db_name)  # cleanup database
        except (Exception, CMDBError) as e:
            import traceback
            traceback.print_tb(e.__traceback__)
            _factory_database_manager.drop(db_name)  # cleanup database
            exit(1)
    if args.start:
        _start_app()
    sleep(0.2)  # prevent logger output
    LOGGER.info("dataGerry successfully started")


if __name__ == "__main__":
    from termcolor import colored

    welcome_string = colored('Welcome to dataGerry \nStarting system with following parameters: \n{}\n', 'yellow')
    brand_string = colored('''
    ########################################################################                                  
    
    @@@@@     @   @@@@@@@ @           @@@@@  @@@@@@@ @@@@@   @@@@@  @@    @@
    @    @    @@     @    @@         @@@@@@@ @@@@@@@ @@@@@@  @@@@@@ @@@  @@@
    @     @  @  @    @   @  @       @@@   @@ @@@     @@   @@ @@   @@ @@  @@ 
    @     @  @  @    @   @  @       @@       @@@@@@  @@   @@ @@   @@  @@@@  
    @     @ @    @   @  @    @      @@   @@@ @@@@@@  @@@@@@  @@@@@@   @@@@  
    @     @ @@@@@@   @  @@@@@@      @@   @@@ @@@     @@@@@   @@@@@     @@   
    @     @ @    @   @  @    @      @@@   @@ @@@     @@ @@@  @@ @@@    @@   
    @    @ @      @  @ @      @      @@@@@@@ @@@@@@@ @@  @@@ @@  @@@   @@   
    @@@@@  @      @  @ @      @       @@@@@@ @@@@@@@ @@  @@@ @@  @@@   @@   
                        
    ########################################################################\n''', 'green')
    license_string = colored('''Copyright (C) 2019 NETHINKS GmbH
licensed under the terms of the GNU Affero General Public License version 3\n''', 'yellow')

    try:
        options = build_arg_parser()
        print(brand_string)
        print(welcome_string.format(options.__dict__))
        print(license_string)
        sleep(0.2)  # prevent logger output
        main(options)
    except Exception as e:
        import cmdb

        if cmdb.__MODE__ == 'DEBUG':
            import traceback

            traceback.print_exc()
        LOGGER.critical("There was an unforeseen error {}".format(e))
        LOGGER.info("dataGerry stopped!")
        exit(1)
