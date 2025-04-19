import React, { useEffect, useState } from 'react';
import { Table, Badge } from 'react-bootstrap';
import { FaHistory, FaUser } from 'react-icons/fa';

const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Mock data - replace with real API call later
    setLogs([
      {
        _id: '1',
        action: 'LOGIN',
        userId: { rank: 'ADMIN', surname: 'Smith' },
        timestamp: new Date(),
        field: 'Authentication'
      }
    ]);
  }, []);

  return (
    <div style={{ color: 'white', padding: '20px' }}>
      <h2><FaHistory /> Audit Logs</h2>
      <Table striped bordered hover variant="dark">
        <thead>
          <tr>
            <th>Action</th>
            <th>User</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log._id}>
              <td><Badge bg="info">{log.action}</Badge></td>
              <td>{log.userId?.rank} {log.userId?.surname}</td>
              <td>{log.timestamp.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AuditLogViewer;