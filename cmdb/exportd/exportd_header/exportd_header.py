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


class ExportdHeader(object):
    """TODO: document"""

    def __init__(self,
                 data: str = '',
                 mimetype: str = 'application/json',
                 charset: str = 'utf-8',
                 status: int = 200,
                 **kwargs):
        """
        Args:
            data: name of this job
            mimetype: Notifies the server of the type of data that can be returned
            charset: Notifies the server which character set the client understands.
            status: The HTTP Status code
            **kwargs: optional params
        """
        self.data = data
        self.mimetype = mimetype
        self.charset = charset
        self.status = status
        super().__init__(**kwargs)
