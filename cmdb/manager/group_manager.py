# DATAGERRY - OpenSource Enterprise CMDB
# Copyright (C) 2024 becon GmbH
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
"""TODO: document"""
from typing import Union

from cmdb.database.database_manager_mongo import DatabaseManagerMongo
from cmdb.user_management import RightManager #TODO: CYCLIC-FIX
from cmdb.manager.managers import ManagerBase

from cmdb.user_management.models.group import UserGroupModel
from cmdb.framework.results import IterationResult
from cmdb.framework.utils import PublicID
from cmdb.search import Pipeline

from cmdb.errors.manager import ManagerUpdateError, ManagerDeleteError, ManagerGetError, ManagerIterationError
# -------------------------------------------------------------------------------------------------------------------- #

class GroupManager(ManagerBase):
    """TODO: document"""

    def __init__(self, database_manager: DatabaseManagerMongo = None,
                 right_manager: RightManager = None,
                 database :str = None):
        self.right_manager: RightManager = right_manager

        if database:
            database_manager.connector.set_database(database)

        super().__init__(UserGroupModel.COLLECTION, database_manager=database_manager)


    def iterate(self, filter: dict, limit: int, skip: int, sort: str, order: int, *args, **kwargs) \
            -> IterationResult[UserGroupModel]:
        """
        Iterate over a collection of group resources.

        Args:
             filter: match requirements of field values
            limit: max number of elements to return
            skip: number of elements to skip first
            sort: sort field
            order: sort order

        Returns:
            IterationResult: Instance of IterationResult with generic CategoryModel.
        """
        try:
            query: Pipeline = self.builder.build(filter=filter, limit=limit, skip=skip, sort=sort, order=order)
            count_query: Pipeline = self.builder.count(filter=filter)
            aggregation_result = list(self._aggregate(self.collection, query))
            total_cursor = self._aggregate(self.collection, count_query)
            total = 0
            while total_cursor.alive:
                total = next(total_cursor)['total']
        except ManagerGetError as err:
            raise ManagerIterationError(err) from err

        iteration_result: IterationResult[UserGroupModel] = IterationResult(aggregation_result, total)
        iteration_result.convert_to(UserGroupModel)

        return iteration_result


    def get(self, public_id: Union[PublicID, int]) -> UserGroupModel:
        """
        Get a single group by its id.

        Args:
            public_id (int): ID of the group.

        Returns:
            UserGroupModel: Instance of UserGroupModel with data.
        """
        cursor_result = self._get(self.collection, filter={'public_id': public_id}, limit=1)

        for resource_result in cursor_result.limit(-1):
            return UserGroupModel.from_data(resource_result, rights=self.right_manager.rights)

        raise ManagerGetError(f'Group with ID: {public_id} not found!')


    def insert(self, group: Union[UserGroupModel, dict]) -> PublicID:
        """
        Insert a single group into the system.

        Args:
            group (dict): Raw data of the group.

        Notes:
            If no public id was given, the database manager will auto insert the next available ID.

        Returns:
            int: The Public ID of the new inserted UserGroupModel
        """
        if isinstance(group, UserGroupModel):
            group = UserGroupModel.to_data(group)

        return self._insert(self.collection, resource=group)


    def update(self, public_id: Union[PublicID, int], group: Union[UserGroupModel, dict]):
        """
        Update a existing group in the system.

        Args:
            public_id (int): PublicID of the user in the system.
            group (UserGroupModel): Instance of UserGroupModel
        """

        update_result = self._update(self.collection, filter={'public_id': public_id}, resource=group)
        if update_result.matched_count != 1:
            raise ManagerUpdateError('Something happened during the update!')
        return update_result


    def delete(self, public_id: Union[PublicID, int]) -> UserGroupModel:
        """
        Delete a existing group by its PublicID.

        Args:
            public_id (int): PublicID of the group in the system.

        Raises:
            ManagerDeleteError: If you try to delete the admin or user group \
                                or something happened during the database operation.

        Returns:
            UserGroupModel: The deleted group as its model.
        """
        if public_id in [1, 2]:
            raise ManagerDeleteError(f'Group with ID: {public_id} can not be deleted!')
        group: UserGroupModel = self.get(public_id=public_id)
        delete_result = self._delete(self.collection, filter={'public_id': public_id})

        if delete_result.deleted_count == 0:
            raise ManagerDeleteError(err='No group matched this public id')

        return group
