import React, { useState } from 'react';
import './Notifications.css';

interface TestStage {
  employee: string;
  role: string;
  status: 'Pending' | 'In Progress' | 'Completed';
}

interface OrderDetails {
  clientName: string;
  transformerType: string;
  quantity: number;
  orderDate: string;
}

interface Tests {
  coreTest: TestStage;
  secondaryTest: TestStage;
  afterPrimaryTest: TestStage;
  finalTest: TestStage;
}

interface ProductionStats {
  totalManufactured: number;
  failedUnits: number;
  ordersCompleted: number;
  date: string;
  efficiencyRate: string;
}

type NotificationType = 'order_workflow' | 'order_completed' | 'daily_production';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  orderId?: string;
  addedBy: string;
  addedAt: string;
  isNew: boolean;
  isRead: boolean;
  requiresApproval?: boolean;
  orderDetails?: OrderDetails;
  tests?: Tests;
  completedAt?: string;
  dispatchedTo?: string;
  trackingNumber?: string;
  productionStats?: ProductionStats;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'order_workflow',
      title: 'A new order has been added',
      orderId: 'ORD-2026-008',
      addedBy: 'Entry Operator',
      addedAt: '2026-01-25 14:30',
      isNew: true,
      isRead: false,
      requiresApproval: true,
      orderDetails: {
        clientName: 'Power Grid Corp',
        transformerType: 'Outdoor Epoxy Resin Cast CT',
        quantity: 45,
        orderDate: '2026-11-02'
      },
      tests: {
        coreTest: { employee: 'Rajesh Kumar', role: 'Core Tester', status: 'Completed' },
        secondaryTest: { employee: 'Priya Sharma', role: 'Secondary Tester', status: 'In Progress' },
        afterPrimaryTest: { employee: 'Amit Patel', role: 'Primary Tester', status: 'Pending' },
        finalTest: { employee: 'Sunita Desai', role: 'Final Tester', status: 'Pending' }
      }
    },
    {
      id: '2',
      type: 'order_completed',
      title: 'Order has been dispatched and completed',
      orderId: 'ORD-2026-007',
      addedBy: 'Production Manager',
      addedAt: '2026-01-25 11:45',
      isNew: true,
      isRead: false,
      completedAt: '2026-01-25 11:30',
      dispatchedTo: 'Power Grid Corp Warehouse',
      trackingNumber: 'TRK-789456123'
    },
    {
      id: '3',
      type: 'daily_production',
      title: 'Daily Production Report',
      addedBy: 'System',
      addedAt: '2026-01-25 09:00',
      isNew: false,
      isRead: true,
      productionStats: {
        totalManufactured: 38,
        failedUnits: 8,
        ordersCompleted: 16,
        date: '2026-01-24',
        efficiencyRate: '93.3%'
      }
    },
    
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, isRead: true, isNew: false } : notification
      )
    );
  };

  const handleApproveOrder = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, requiresApproval: false } : notification
      )
    );
  };

  const filteredNotifications = notifications.filter(notification =>
    notification.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (notification.orderDetails?.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    notification.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderOrderWorkflow = (notification: Notification) => (
    <>
      <div className="order-details-section">
        <h4 className="section-label">Order Details</h4>
        <div className="order-details-grid">
          <div className="detail-field">
            <span className="field-label">Client Name</span>
            <span className="field-value">{notification.orderDetails?.clientName}</span>
          </div>
          <div className="detail-field">
            <span className="field-label">Transformer Type</span>
            <span className="field-value">{notification.orderDetails?.transformerType}</span>
          </div>
          <div className="detail-field">
            <span className="field-label">Quantity</span>
            <span className="field-value">{notification.orderDetails?.quantity} units</span>
          </div>
          <div className="detail-field">
            <span className="field-label">Order Date</span>
            <span className="field-value">{notification.orderDetails?.orderDate}</span>
          </div>
        </div>
      </div>

      <div className="assignments-section">
        <h4 className="section-label">Employee Assignments</h4>
        <div className="test-stages-list">
          {notification.tests && ['coreTest', 'secondaryTest', 'afterPrimaryTest', 'finalTest'].map((testKey) => {
            const test = notification.tests![testKey as keyof Tests];
            const testName = testKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return (
              <div key={testKey} className="test-stage-item">
                <div className="test-stage-info">
                  <div className="test-stage-header">
                    <span className={`status-indicator ${test.status.toLowerCase().replace(' ', '-')}`}>
                      {test.status}
                    </span>
                    <span className="test-stage-name">{testName}</span>
                  </div>
                  <div className="employee-details">
                    <span className="employee-name">{test.employee}</span>
                    <span className="employee-role">{test.role}</span>
                  </div>
                </div>
                <button className="change-assignee-btn">Change</button>
              </div>
            );
          })}
        </div>
      </div>

      {notification.requiresApproval && (
        <div className="approval-required-section">
          <div className="approval-message">
            This order will be confirmed and processed after your approval.
          </div>
          <button onClick={() => handleApproveOrder(notification.id)} className="approve-order-btn">
            Approve Order
          </button>
        </div>
      )}
    </>
  );

  const renderOrderCompleted = (notification: Notification) => (
    <>
      <div className="order-details-section">
        <h4 className="section-label">Order Completion Details</h4>
        <div className="order-details-grid">
          <div className="detail-field">
            <span className="field-label">Order ID</span>
            <span className="field-value">{notification.orderId}</span>
          </div>
          <div className="detail-field">
            <span className="field-label">Completed At</span>
            <span className="field-value">{notification.completedAt}</span>
          </div>
          <div className="detail-field">
            <span className="field-label">Dispatched To</span>
            <span className="field-value">{notification.dispatchedTo}</span>
          </div>
          <div className="detail-field">
            <span className="field-label">Tracking Number</span>
            <span className="field-value tracking-number">{notification.trackingNumber}</span>
          </div>
        </div>
      </div>

      <div className="completion-status-section">
        <div className="completion-message">
          <svg className="check-icon" viewBox="0 0 24 24" fill="none">
            <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="message-content">
            <h4 className="message-title">Order Successfully Completed</h4>
            <p className="message-description">
              The order has been processed, tested, and dispatched to the client. All quality checks passed successfully.
            </p>
          </div>
        </div>
      </div>
    </>
  );

  const renderDailyProduction = (notification: Notification) => (
    <>
      <div className="production-stats-section">
        <h4 className="section-label">Production Statistics for {notification.productionStats?.date}</h4>
        <div className="production-stats-grid">
          <div className="stat-card total-manufactured">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M20 7L12 3L4 7V17L12 21L20 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 21V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 7L12 11L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{notification.productionStats?.totalManufactured}</span>
              <span className="stat-label">Total Transformers Manufactured</span>
            </div>
          </div>

          <div className="stat-card failed-units">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M10 14L12 12M12 12L14 10M12 12L10 10M12 12L14 14M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{notification.productionStats?.failedUnits}</span>
              <span className="stat-label">Failed Units</span>
            </div>
          </div>

          <div className="stat-card orders-completed">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{notification.productionStats?.ordersCompleted}</span>
              <span className="stat-label">Orders Completed</span>
            </div>
          </div>

          <div className="stat-card efficiency-rate">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{notification.productionStats?.efficiencyRate}</span>
              <span className="stat-label">Efficiency Rate</span>
            </div>
          </div>
        </div>
      </div>

      <div className="production-summary-section">
        <div className="summary-message">
          <h4 className="summary-title">Daily Production Summary</h4>
          <p className="summary-description">
            Production for {notification.productionStats?.date} completed. 
            {notification.productionStats && notification.productionStats.failedUnits > 0 
              ? ` ${notification.productionStats.failedUnits} units failed quality checks.`
              : ' All units passed quality checks.'}
          </p>
        </div>
      </div>
    </>
  );

  return (
    <div className="notifications-container">
      <div className="notifications-page-header">
        <div className="page-header-left">
          <h1>Notifications</h1>
          {unreadCount > 0 && (
            <div className="unread-count-badge">
              <span className="badge-text">Unread</span>
              <span className="badge-count">{unreadCount}</span>
            </div>
          )}
        </div>
        <div className="page-header-right">
          <div className="search-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none">
              <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      <div className="notifications-list-wrapper">
        {filteredNotifications.map((notification) => (
          <div key={notification.id} className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}>
            <div className="notification-item-header">
              <div className="notification-header-left">
                <div className="notification-title-section">
                  <div className="notification-icon-title">
                    <div className="notification-icon">
                      {notification.type === 'order_workflow' && (
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {notification.type === 'order_completed' && (
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {notification.type === 'daily_production' && (
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M9 17V15M12 17V13M15 17V11M5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <h3 className="notification-main-title">{notification.title}</h3>
                    {notification.isNew && <span className="new-tag">NEW</span>}
                  </div>
                  <div className="notification-meta-info">
                    {notification.orderId && <span className="order-id-tag">{notification.orderId}</span>}
                    <span className="added-by-info">Added by {notification.addedBy} • {notification.addedAt}</span>
                  </div>
                </div>
              </div>
              <div className="notification-header-right">
                {!notification.isRead && (
                  <button onClick={() => handleMarkAsRead(notification.id)} className="mark-as-read-btn">
                    Mark as Read
                  </button>
                )}
              </div>
            </div>

            {notification.type === 'order_workflow' && renderOrderWorkflow(notification)}
            {notification.type === 'order_completed' && renderOrderCompleted(notification)}
            {notification.type === 'daily_production' && renderDailyProduction(notification)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;