import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter object using Gmail SMTP
// Helper to create transporter with dynamic settings
const createTransporter = (settings) => {
  return nodemailer.createTransport({
    host: settings?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(settings?.smtpPort || process.env.SMTP_PORT) || 587,
    secure: (parseInt(settings?.smtpPort) === 465) || (process.env.SMTP_SECURE === 'true'),
    auth: {
      user: settings?.smtpUser || process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Verify connection configuration
export async function verifyEmailConnection(settings = null) {
  try {
    const transporter = createTransporter(settings);
    await transporter.verify();
    console.log('✅ Email server connection verified');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error.message);
    return false;
  }
}

// Send low stock alert email
export async function sendLowStockEmail(medicines, settings) {
  // Check if notifications are enabled
  if (!settings?.lowStockAlerts || !settings?.emailNotifications) {
    console.log('Low stock email skipped - notifications disabled in settings');
    return { success: false, reason: 'disabled' };
  }

  const medicineList = medicines.map(m =>
    `<tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${m.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${m.stock} ${m.unit}</td>
      <td style="padding: 8px; border: 1px solid #ddd; color: ${m.stock <= 5 ? '#dc2626' : '#f59e0b'};">
        ${m.stock <= 5 ? 'CRITICAL' : 'Low'}
      </td>
    </tr>`
  ).join('');

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; }
        th { background-color: #059669; color: white; padding: 12px; text-align: left; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>⚠️ Low Stock Alert</h2>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>The following medicines are running low in inventory:</p>
          
          <table>
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Current Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${medicineList}
            </tbody>
          </table>
          
          <p style="margin-top: 20px;">
            <strong>Action Required:</strong> Please reorder these medicines to avoid stockouts.
          </p>
          
          <div class="footer">
            <p>This is an automated notification from ${process.env.STORE_NAME || 'AI Pharmacy'}.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = createTransporter(settings);
    const fromEmail = settings?.smtpUser || settings?.storeEmail || process.env.STORE_EMAIL;
    const ownerEmail = settings?.ownerEmail || process.env.OWNER_EMAIL;
    const storeName = settings?.storeName || process.env.STORE_NAME || 'AI Pharmacy';

    await transporter.sendMail({
      from: `"${storeName}" <${fromEmail}>`,
      to: ownerEmail,
      subject: `⚠️ Low Stock Alert - ${medicines.length} Item(s) Need Attention`,
      html: emailHtml
    });

    console.log(`✅ Low stock email sent for ${medicines.length} medicines`);
    return { success: true, count: medicines.length };
  } catch (error) {
    console.error('❌ Failed to send low stock email:', error);
    return { success: false, error: error.message };
  }
}

// Send expiry alert email
export async function sendExpiryAlertEmail(expiringMedicines, settings) {
  if (!settings?.expiryAlerts || !settings?.emailNotifications) {
    console.log('Expiry alert email skipped - notifications disabled in settings');
    return { success: false, reason: 'disabled' };
  }

  const medicineList = expiringMedicines.map(m => {
    const daysUntilExpiry = Math.ceil((new Date(m.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return `<tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${m.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${m.stock} ${m.unit}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${new Date(m.expiryDate).toLocaleDateString()}</td>
      <td style="padding: 8px; border: 1px solid #ddd; color: ${daysUntilExpiry <= 7 ? '#dc2626' : '#f59e0b'};">
        ${daysUntilExpiry} days
      </td>
    </tr>`;
  }).join('');

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; }
        th { background-color: #059669; color: white; padding: 12px; text-align: left; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📅 Medicine Expiry Alert</h2>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>The following medicines are expiring soon:</p>
          
          <table>
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Stock</th>
                <th>Expiry Date</th>
                <th>Time Remaining</th>
              </tr>
            </thead>
            <tbody>
              ${medicineList}
            </tbody>
          </table>
          
          <p style="margin-top: 20px;">
            <strong>Action Required:</strong> Consider running promotions or discounts to move these items before expiry.
          </p>
          
          <div class="footer">
            <p>This is an automated notification from ${process.env.STORE_NAME || 'AI Pharmacy'}.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = createTransporter(settings);
    const fromEmail = settings?.smtpUser || settings?.storeEmail || process.env.STORE_EMAIL;
    const ownerEmail = settings?.ownerEmail || process.env.OWNER_EMAIL;
    const storeName = settings?.storeName || process.env.STORE_NAME || 'AI Pharmacy';

    await transporter.sendMail({
      from: `"${storeName}" <${fromEmail}>`,
      to: ownerEmail,
      subject: `📅 Expiry Alert - ${expiringMedicines.length} Medicine(s) Expiring Soon`,
      html: emailHtml
    });

    console.log(`✅ Expiry alert email sent for ${expiringMedicines.length} medicines`);
    return { success: true, count: expiringMedicines.length };
  } catch (error) {
    console.error('❌ Failed to send expiry alert email:', error);
    return { success: false, error: error.message };
  }
}

// Send daily sales summary email
export async function sendDailySalesSummary(summary, settings, force = false) {
  if ((!settings?.dailySalesSummary && !force) || !settings?.emailNotifications) {
    console.log('Daily sales summary email skipped - notifications disabled in settings');
    return { success: false, reason: 'disabled' };
  }

  const { date, totalSales, totalRevenue, totalTransactions, topMedicines, paymentBreakdown } = summary;

  const topMedicinesList = topMedicines?.slice(0, 5).map((m, i) =>
    `<tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${i + 1}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${m.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${m.quantity}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">Rs ${m.revenue.toFixed(2)}</td>
    </tr>`
  ).join('') || '<tr><td colspan="4" style="padding: 8px; text-align: center;">No sales data</td></tr>';

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat-box { background: white; padding: 15px; border-radius: 8px; text-align: center; flex: 1; margin: 0 5px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #059669; }
        .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; }
        th { background-color: #059669; color: white; padding: 12px; text-align: left; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📊 Daily Sales Summary</h2>
          <p style="margin: 0;">${date || new Date().toLocaleDateString()}</p>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Here's your daily sales summary:</p>
          
          <div class="stats">
            <div class="stat-box">
              <div class="stat-value">${totalTransactions || 0}</div>
              <div class="stat-label">Transactions</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${totalSales || 0}</div>
              <div class="stat-label">Items Sold</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">Rs ${(totalRevenue || 0).toFixed(0)}</div>
              <div class="stat-label">Revenue</div>
            </div>
          </div>
          
          <h3 style="color: #059669; margin-top: 30px;">Top 5 Medicines</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Medicine</th>
                <th>Units Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${topMedicinesList}
            </tbody>
          </table>
          
          ${paymentBreakdown ? `
          <h3 style="color: #059669; margin-top: 30px;">Payment Methods</h3>
          <p>Cash: Rs ${(paymentBreakdown.cash || 0).toFixed(2)} | Card: Rs ${(paymentBreakdown.card || 0).toFixed(2)}</p>
          ` : ''}
          
          <div class="footer">
            <p>This is your automated daily report from ${process.env.STORE_NAME || 'AI Pharmacy'}.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = createTransporter(settings);
    const fromEmail = settings?.smtpUser || settings?.storeEmail || process.env.STORE_EMAIL;
    const ownerEmail = settings?.ownerEmail || process.env.OWNER_EMAIL;
    const storeName = settings?.storeName || process.env.STORE_NAME || 'AI Pharmacy';

    await transporter.sendMail({
      from: `"${storeName}" <${fromEmail}>`,
      to: ownerEmail,
      subject: `📊 Daily Sales Summary - ${date || new Date().toLocaleDateString()}`,
      html: emailHtml
    });

    console.log('✅ Daily sales summary email sent');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send daily sales summary email:', error);
    return { success: false, error: error.message };
  }
}

// Send test email
export async function sendTestEmail(settings) {
  try {
    // For test email, we might not have settings if called from a route that doesn't pass them
    // But usually we should pass settings. 
    // Assuming settings is passed (I need to update function signature below)
    const transporter = createTransporter(settings);
    const fromEmail = settings?.smtpUser || settings?.storeEmail || process.env.STORE_EMAIL;
    const ownerEmail = settings?.ownerEmail || process.env.OWNER_EMAIL;
    const storeName = settings?.storeName || process.env.STORE_NAME || 'AI Pharmacy';

    await transporter.sendMail({
      from: `"${storeName}" <${fromEmail}>`,
      to: ownerEmail,
      subject: '✅ Test Email - AI Pharmacy Notification System',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #059669;">🎉 Email Configuration Successful!</h2>
          <p>If you're reading this, your Gmail SMTP configuration is working correctly.</p>
          <p><strong>Store Name:</strong> ${storeName}</p>
          <p><strong>From Email:</strong> ${fromEmail}</p>
          <p><strong>SMTP Server:</strong> ${settings?.smtpHost || process.env.SMTP_HOST}:${settings?.smtpPort || process.env.SMTP_PORT}</p>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            Test email sent at: ${new Date().toLocaleString()}
          </p>
        </body>
        </html>
      `
    });

    console.log('✅ Test email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    return { success: false, error: error.message };
  }
}

// Send inventory report email
export async function sendInventoryReportEmail(inventoryData, settings) {
  if (!settings?.emailNotifications) {
    console.log('Inventory report email skipped - email notifications disabled');
    return { success: false, reason: 'disabled' };
  }

  const inventoryList = inventoryData.map(m =>
    `<tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${m.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${m.stock} ${m.unit}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">Rs ${(m.costPrice || m.price || 0).toFixed(2)}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">Rs ${(m.stock * (m.costPrice || m.price || 0)).toFixed(2)}</td>
      <td style="padding: 8px; border: 1px solid #ddd; color: ${m.stock <= 10 ? '#dc2626' : '#059669'};">
        ${m.status || 'Active'}
      </td>
    </tr>`
  ).join('');

  const totalValue = inventoryData.reduce((sum, m) => sum + (m.stock * (m.costPrice || m.price || 0)), 0);
  const totalItems = inventoryData.length;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat-box { background: white; padding: 15px; border-radius: 8px; text-align: center; flex: 1; margin: 0 5px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; }
        th { background-color: #059669; color: white; padding: 12px; text-align: left; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📦 Full Inventory Report</h2>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Here's the complete inventory status:</p>
          
          <div class="stats">
            <div class="stat-box">
              <div class="stat-value">${totalItems}</div>
              <div style="font-size: 12px; color: #666;">Total Items</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">Rs ${totalValue.toFixed(0)}</div>
              <div style="font-size: 12px; color: #666;">Total Value</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Stock</th>
                <th>Unit Price</th>
                <th>Total Value</th>
                <th>Status</th>
              </tr>        
            </thead>
            <tbody>
              ${inventoryList}
            </tbody>
          </table>
          
          <div class="footer">
            <p>This is an automated report from ${process.env.STORE_NAME || 'AI Pharmacy'}.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = createTransporter(settings);
    const fromEmail = settings?.smtpUser || settings?.storeEmail || process.env.STORE_EMAIL;
    const ownerEmail = settings?.ownerEmail || process.env.OWNER_EMAIL;
    const storeName = settings?.storeName || process.env.STORE_NAME || 'AI Pharmacy';

    await transporter.sendMail({
      from: `"${storeName}" <${fromEmail}>`,
      to: ownerEmail,
      subject: `📦 Inventory Report - ${totalItems} Items`,
      html: emailHtml
    });

    console.log(`✅ Inventory report email sent for ${totalItems} items`);
    return { success: true, count: totalItems };
  } catch (error) {
    console.error('❌ Failed to send inventory report email:', error);
    return { success: false, error: error.message };
  }
}

// Send returns report email
export async function sendReturnsReportEmail(returns, settings) {
  if (!settings?.emailNotifications) {
    console.log('Returns report email skipped - email notifications disabled');
    return { success: false, reason: 'disabled' };
  }

  const returnsList = returns.map(r =>
    `<tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${new Date(r.createdAt).toLocaleDateString()}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${r.customerName || 'N/A'}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${r.medicineName || r.items?.length || 0} item(s)</td>
      <td style="padding: 8px; border: 1px solid #ddd;">Rs ${(r.total || 0).toFixed(2)}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${r.reason || 'Not specified'}</td>
    </tr>`
  ).join('');

  const totalRefund = returns.reduce((sum, r) => sum + (r.total || 0), 0);

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background-color: #a855f7; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; }
        th { background-color: #059669; color: white; padding: 12px; text-align: left; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🔄 Returns Report</h2>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Summary of product returns and refunds:</p>
          
          <p><strong>Total Returns:</strong> ${returns.length} | <strong>Total Refunds:</strong> Rs ${totalRefund.toFixed(2)}</p>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Refund Amount</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              ${returnsList || '<tr><td colspan="5" style="padding: 8px; text-align: center;">No returns found</td></tr>'}
            </tbody>
          </table>
          
          <div class="footer">
            <p>This is an automated report from ${process.env.STORE_NAME || 'AI Pharmacy'}.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = createTransporter(settings);
    const fromEmail = settings?.smtpUser || settings?.storeEmail || process.env.STORE_EMAIL;
    const ownerEmail = settings?.ownerEmail || process.env.OWNER_EMAIL;
    const storeName = settings?.storeName || process.env.STORE_NAME || 'AI Pharmacy';

    await transporter.sendMail({
      from: `"${storeName}" <${fromEmail}>`,
      to: ownerEmail,
      subject: `🔄 Returns Report - ${returns.length} Return(s)`,
      html: emailHtml
    });

    console.log(`✅ Returns report email sent for ${returns.length} returns`);
    return { success: true, count: returns.length };
  } catch (error) {
    console.error('❌ Failed to send returns report email:', error);
    return { success: false, error: error.message };
  }
}

// Send transaction history email
export async function sendTransactionHistoryEmail(transactions, settings, period = 'Recent') {
  if (!settings?.emailNotifications) {
    console.log('Transaction history email skipped - email notifications disabled');
    return { success: false, reason: 'disabled' };
  }

  const transactionList = transactions.slice(0, 50).map(t =>
    `<tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${new Date(t.createdAt).toLocaleString()}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${t.orderNumber || t._id}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${t.customerName || 'Walk-in'}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${t.items?.length || 0}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">Rs ${(t.total || 0).toFixed(2)}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${t.paymentMethod || 'Cash'}</td>
    </tr>`
  ).join('');

  const totalRevenue = transactions.reduce((sum, t) => sum + (t.total || 0), 0);

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background-color: #06b6d4; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; font-size: 13px; }
        th { background-color: #059669; color: white; padding: 12px; text-align: left; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>📝 Transaction History</h2>
          <p style="margin: 0;">${period}</p>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Transaction history report:</p>
          
          <p><strong>Total Transactions:</strong> ${transactions.length} | <strong>Total Revenue:</strong> Rs ${totalRevenue.toFixed(2)}</p>
          ${transactions.length > 50 ? `<p style="color: #f59e0b;"><em>Showing first 50 of ${transactions.length} transactions</em></p>` : ''}
          
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              ${transactionList || '<tr><td colspan="6" style="padding: 8px; text-align: center;">No transactions found</td></tr>'}
            </tbody>
          </table>
          
          <div class="footer">
            <p>This is an automated report from ${process.env.STORE_NAME || 'AI Pharmacy'}.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = createTransporter(settings);
    const fromEmail = settings?.smtpUser || settings?.storeEmail || process.env.STORE_EMAIL;
    const ownerEmail = settings?.ownerEmail || process.env.OWNER_EMAIL;
    const storeName = settings?.storeName || process.env.STORE_NAME || 'AI Pharmacy';

    await transporter.sendMail({
      from: `"${storeName}" <${fromEmail}>`,
      to: ownerEmail,
      subject: `📝 Transaction History - ${transactions.length} Transaction(s)`,
      html: emailHtml
    });

    console.log(`✅ Transaction history email sent for ${transactions.length} transactions`);
    return { success: true, count: transactions.length };
  } catch (error) {
    console.error('❌ Failed to send transaction history email:', error);
    return { success: false, error: error.message };
  }
}

export default {
  verifyEmailConnection,
  sendLowStockEmail,
  sendExpiryAlertEmail,
  sendDailySalesSummary,
  sendInventoryReportEmail,
  sendReturnsReportEmail,
  sendTransactionHistoryEmail,
  sendTestEmail
};
