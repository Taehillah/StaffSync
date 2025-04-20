import { useEffect, useState } from 'react';
import { Table, Badge } from 'react-bootstrap';
import { FaHistory, FaUser, FaInfoCircle } from 'react-icons/fa';
import { getLogs } from '../../services/auditService';
import { formatDTG } from '../../utils/dateUtils';

const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const loadLogs = async () => {
      const res = await getLogs();
      setLogs(res.data);
    };
    loadLogs();
  }, []);

  return (
    <div className="glass-card p-4">
      <h3><FaHistory className="me-2" />System Audit Log</h3>
      
      <Table striped bordered hover variant="dark" className="mt-3">
        <thead>
          <tr>
            <th>DTG</th>
            <th>Action</th>
            <th>User</th>
            <th>Target</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log._id}>
              <td>{formatDTG(new Date(log.timestamp))}</td>
              <td>
                <Badge bg={
                  log.action === 'UPDATE' ? 'info' : 
                  log.action === 'CREATE' ? 'success' : 'danger'
                }>
                  {log.action}
                </Badge>
              </td>
              <td><FaUser className="me-1" />{log.userId?.rank || 'System'}</td>
              <td>{log.targetUserId ? `User ${log.targetUserId}` : 'N/A'}</td>
              <td>
                <button 
                  className="btn btn-sm btn-outline-info"
                  onClick={() => showDetails(log)}
                >
                  <FaInfoCircle />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};