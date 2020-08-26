# DATAGERRY - OpenSource Enterprise CMDB
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

import logging
from flask import current_app
from cmdb.interface.route_utils import login_required, insert_request_user, make_response, right_required
from cmdb.interface.blueprint import RootBlueprint
from cmdb.user_management import User
from cmdb.utils.system_reader import SystemSettingsReader

LOGGER = logging.getLogger(__name__)
try:
    from cmdb.utils.error import CMDBError
except ImportError:
    CMDBError = Exception

settings_blueprint = RootBlueprint('settings_rest', __name__, url_prefix='/settings')

with current_app.app_context():
    from cmdb.interface.rest_api.settings_routes.system_routes import system_blueprint

    settings_blueprint.register_nested_blueprint(system_blueprint)

    system_settings_reader = SystemSettingsReader(database_manager=current_app.database_manager)


@settings_blueprint.route('/<string:section>/', methods=['GET'])
@settings_blueprint.route('/<string:section>', methods=['GET'])
@login_required
@insert_request_user
@right_required('base.system.view')
def get_settings_from_section(section: str, request_user: User):
    section_settings = system_settings_reader.get_all_values_from_section(section=section)
    if len(section_settings) < 1:
        return make_response([], 204)
    return make_response(section_settings)


@settings_blueprint.route('/<string:section>/<string:name>/', methods=['GET'])
@settings_blueprint.route('/<string:section>/<string:name>', methods=['GET'])
@login_required
@insert_request_user
@right_required('base.system.view')
def get_value_from_section(section: str, name: str, request_user: User):
    section_settings = system_settings_reader.get_value(name=name, section=section)
    if len(section_settings) < 1:
        return make_response([], 204)
    return make_response(section_settings)
