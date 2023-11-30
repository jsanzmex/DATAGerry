# DATAGERRY - OpenSource Enterprise CMDB
# Copyright (C) 2023 becon GmbH
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
from enum import unique, Enum, auto
# -------------------------------------------------------------------------------------------------------------------- #

@unique
class AccessControlPermission(Enum):
    """Permission enum for possible ACL operations."""

    def _generate_next_value_(self, start, count, last_values):
        """TODO: document"""
        return self

    CREATE = auto()
    READ = auto()
    UPDATE = auto()
    DELETE = auto()
