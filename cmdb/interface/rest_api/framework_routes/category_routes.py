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
# along with this program. If not, see <https://www.gnu.org/licenses/>.

import logging

from flask import abort, current_app, request

from cmdb.framework.dao.category import CategoryDAO
from cmdb.framework.manager import ManagerGetError, ManagerInsertError, ManagerDeleteError
from cmdb.framework.manager.category_manager import CategoryManager
from cmdb.framework.manager.error.framework_errors import FrameworkIterationError
from cmdb.framework.manager.results import IterationResult
from cmdb.framework.utils import PublicID
from cmdb.interface.api_parameters import CollectionParameters
from cmdb.interface.response import GetSingleResponse, GetMultiResponse, InsertSingleResponse, DeleteSingleResponse
from cmdb.interface.blueprint import APIBlueprint

LOGGER = logging.getLogger(__name__)
categories_blueprint = APIBlueprint('categories', __name__)


@categories_blueprint.route('/', methods=['GET'])
@categories_blueprint.protect(auth=True, right='base.framework.category.view')
@categories_blueprint.parse_collection_parameters(view='list')
def get_categories(params: CollectionParameters):
    category_manager: CategoryManager = CategoryManager(database_manager=current_app.database_manager)
    try:
        iteration_result: IterationResult[CategoryDAO] = category_manager.iterate(
            filter=params.filter, limit=params.limit, skip=params.skip, sort=params.sort, order=params.order)
    except FrameworkIterationError as err:
        return abort(400, err.message)
    except ManagerGetError as err:
        return abort(404, err.message)
    category_list = [CategoryDAO.to_json(category) for category in iteration_result.results]
    api_response = GetMultiResponse(category_list, total=iteration_result.total, page=params.page, limit=params.limit,
                                    url=request.url, model=CategoryDAO.MODEL)
    return api_response.make_response()


@categories_blueprint.route('/<int:public_id>', methods=['GET'])
@categories_blueprint.protect(auth=True, right='base.framework.category.view')
def get_category(public_id: int):
    """HTTP GET call for a single category by the public id"""
    category_manager: CategoryManager = CategoryManager(database_manager=current_app.database_manager)
    try:
        category_instance = category_manager.get(public_id)
    except ManagerGetError as err:
        return abort(404, err.message)
    api_response = GetSingleResponse(CategoryDAO.to_json(category_instance), url=request.url,
                                     model=CategoryDAO.MODEL)
    return api_response.make_response()


@categories_blueprint.route('/', methods=['POST'])
@categories_blueprint.protect(auth=True, right='base.framework.category.add')
@categories_blueprint.validate(CategoryDAO.SCHEMA)
def insert_category(document: dict):
    category_manager: CategoryManager = CategoryManager(database_manager=current_app.database_manager)
    try:
        result_id: PublicID = category_manager.insert(document)
    except ManagerInsertError as err:
        return abort(400, err.message)
    api_response = InsertSingleResponse(result_id, model=CategoryDAO.MODEL)
    return api_response.make_response(prefix='category')


@categories_blueprint.route('/<int:public_id>', methods=['DELETE'])
@categories_blueprint.protect(auth=True, right='base.framework.category.delete')
def delete_category(public_id: int):
    category_manager: CategoryManager = CategoryManager(database_manager=current_app.database_manager)
    try:
        delete_response = category_manager.delete(public_id=PublicID(public_id))
        api_response = DeleteSingleResponse(raw=delete_response.raw_result, model=CategoryDAO.MODEL)
    except ManagerDeleteError as err:
        return abort(404, err.message)
    return api_response.make_response()
