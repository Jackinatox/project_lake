import React from 'react';
import { UserModel } from 'pterodactyl.js';
import Table from '@mui/joy/Table';
import { Box, Button } from '@mui/joy';
import { redirect } from 'next/dist/server/api-utils';
import Link from 'next/link';
import { PencilLine } from 'lucide-react';

interface UsersTableProps {
  users: UserModel[];
}

const UsersTable: React.FC<UsersTableProps> = ({ users }) => {
  return (
      <Table aria-label="user table" borderAxis="both" variant="outlined" sx={{ tableLayout: "auto" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Edit</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button component={Link} href={`users/${user.id}`} size="sm" variant="plain" color="neutral">
                    <PencilLine />
                  </Button>
                </Box>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
  );
};

export default UsersTable;
