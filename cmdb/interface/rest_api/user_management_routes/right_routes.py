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


from flask import request, abort

from cmdb.manager.errors import ManagerGetError, ManagerIterationError
from cmdb.framework.results import IterationResult
from cmdb.interface.api_parameters import CollectionParameters
from cmdb.interface.blueprint import APIBlueprint
from cmdb.interface.response import GetMultiResponse, GetSingleResponse
from cmdb.user_management.managers.right_manager import RightManager
from cmdb.user_management.models.right import BaseRight
from cmdb.user_management.rights import __all__ as right_tree
from cmdb.user_management.models.right import _nameToLevel

rights_blueprint = APIBlueprint('rights', __name__)


@rights_blueprint.route('/', methods=['GET', 'HEAD'])
@rights_blueprint.protect(auth=False, right=None)
@rights_blueprint.parse_collection_parameters(sort='name', view='list')
def get_rights(params: CollectionParameters):
    right_manager = RightManager(right_tree)
    body = request.method == 'HEAD'

    try:
        if params.optional['view'] == 'tree':
            api_response = GetMultiResponse(right_manager.tree_to_json(right_tree), total=len(right_tree),
                                            params=params, url=request.url, model='Right-Tree', body=body)
            return api_response.make_response(pagination=False)
        else:
            iteration_result: IterationResult[BaseRight] = right_manager.iterate(
                filter=params.filter, limit=params.limit, skip=params.skip, sort=params.sort, order=params.order)
            rights = [BaseRight.to_dict(type) for type in iteration_result.results]
            api_response = GetMultiResponse(rights, total=iteration_result.total, params=params,
                                            url=request.url, model='Right', body=body)
            return api_response.make_response()
    except ManagerIterationError as err:
        return abort(400, err.message)
    except ManagerGetError as err:
        return abort(404, err.message)


@rights_blueprint.route('/<string:name>', methods=['GET', 'HEAD'])
@rights_blueprint.protect(auth=False, right='None')
def get_right(name: str):
    right_manager: RightManager = RightManager(right_tree)
    body = True if not request.method != 'HEAD' else False

    try:
        right = right_manager.get(name)
    except ManagerGetError as err:
        return abort(404, err.message)
    api_response = GetSingleResponse(BaseRight.to_dict(right), url=request.url,
                                     model='Right', body=body)
    return api_response.make_response()


@rights_blueprint.route('/levels', methods=['GET', 'HEAD'])
@rights_blueprint.protect(auth=False, right='None')
def get_levels():
    body = True if not request.method != 'HEAD' else False

    api_response = GetSingleResponse(_nameToLevel, url=request.url,
                                     model='Security-Level', body=body)
    return api_response.make_response()


@rights_blueprint.route('/levels/<string:name>', methods=['GET', 'HEAD'])
@rights_blueprint.protect(auth=False, right='None')
def get_level(name: str):
    body = True if not request.method != 'HEAD' else False
    level = _nameToLevel.get(name)
    if not level:
        raise ManagerGetError(f'No level with the name: {name}')

    api_response = GetSingleResponse(level, url=request.url, model='Security-Level', body=body)
    return api_response.make_response()
