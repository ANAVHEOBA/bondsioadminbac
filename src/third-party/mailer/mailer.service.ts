// src/third-party/mailer/mailer.service.ts
import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer'; // Renamed import

@Injectable()
export class CustomMailerService { // ✅ Renamed class to avoid conflict
  constructor(private readonly mailService: NestMailerService) {} // Use renamed import

  async sendEarlyAccessEmail(to: string, accessCode: string, deviceOS?: string[]): Promise<void> {
    const fromName = process.env.MAIL_FROM_NAME ?? 'Bondsio';
    const fromAddress = process.env.MAIL_FROM_ADDRESS ?? 'noreply@bondsio.com';

    // Send notification emails to admin team asynchronously (don't block user response)
    setImmediate(() => {
      this.sendEarlyAccessNotification(to, deviceOS).catch(err => {
        console.error('Failed to send admin notification:', err);
      });
    });

    // Generate platform-specific instructions
    const platformInstructions = this.generatePlatformInstructions(deviceOS, accessCode);

    // Send email asynchronously (don't block the response)
    setImmediate(() => {
      this.mailService.sendMail({
      to,
      from: `"${fromName}" <${fromAddress}>`,
      subject: '🎉 Welcome to Bondsio – Your Early Access is Ready!',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Welcome to Bondsio</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #2c3e50;
              max-width: 650px;
              margin: 0 auto;
              padding: 0;
              background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 50px 20px;
              text-align: center;
              border-radius: 20px 20px 0 0;
              position: relative;
              overflow: hidden;
            }
            .container::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
              opacity: 0.3;
            }
            .content {
              background: white;
              padding: 50px 40px;
              border-radius: 0 0 20px 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              position: relative;
              z-index: 1;
            }
            h1 { 
              color: white; 
              font-size: 36px; 
              margin: 0;
              font-weight: 800;
              text-shadow: 0 4px 8px rgba(0,0,0,0.3);
              position: relative;
              z-index: 2;
            }
            .subtitle {
              color: rgba(255,255,255,0.95);
              font-size: 20px;
              margin: 15px 0 0 0;
              font-weight: 400;
              position: relative;
              z-index: 2;
            }
            h2 { 
              color: #2c3e50; 
              font-size: 24px; 
              margin: 30px 0 20px 0;
              font-weight: 600;
            }
            h3 {
              color: #34495e;
              font-size: 20px;
              margin: 25px 0 15px 0;
              font-weight: 600;
            }
            .access-code {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 20px;
              border-radius: 12px;
              font-size: 24px;
              font-weight: bold;
              text-align: center;
              margin: 25px 0;
              letter-spacing: 2px;
              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            }
            .platform-section {
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              border-radius: 16px;
              padding: 30px;
              margin: 25px 0;
              border-left: 5px solid #667eea;
              box-shadow: 0 4px 15px rgba(0,0,0,0.05);
              transition: transform 0.2s ease;
            }
            .platform-section:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            }
            .ios-section {
              border-left-color: #007AFF;
              background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
            }
            .android-section {
              border-left-color: #3DDC84;
              background: linear-gradient(135deg, #f0fff4 0%, #e6ffe6 100%);
            }
            .step {
              background: white;
              border-radius: 12px;
              padding: 20px;
              margin: 15px 0;
              border-left: 4px solid #667eea;
              box-shadow: 0 4px 12px rgba(0,0,0,0.08);
              transition: all 0.2s ease;
            }
            .step:hover {
              transform: translateX(5px);
              box-shadow: 0 6px 20px rgba(0,0,0,0.12);
            }
            .step-number {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              margin-right: 15px;
              font-size: 16px;
              box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
            }
            .download-link {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 24px;
              border-radius: 25px;
              text-decoration: none;
              font-weight: 600;
              margin: 10px 0;
              transition: transform 0.2s;
            }
            .download-link:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            }
            .testflight-link {
              background: linear-gradient(135deg, #007AFF 0%, #0056CC 100%);
            }
            .playstore-link {
              background: linear-gradient(135deg, #3DDC84 0%, #2E7D32 100%);
            }
            .highlight {
              background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
              border: 1px solid #fdcb6e;
              border-radius: 12px;
              padding: 20px;
              margin: 25px 0;
              box-shadow: 0 4px 15px rgba(253, 203, 110, 0.2);
            }
            .footer {
              margin-top: 50px;
              padding-top: 40px;
              border-top: 2px solid #e9ecef;
              font-size: 15px;
              color: #6c757d;
              text-align: center;
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              border-radius: 12px;
              padding: 30px;
            }
            .social-links {
              margin: 30px 0;
              text-align: center;
            }
            .social-links a {
              display: inline-block;
              margin: 0 15px;
              color: #667eea;
              text-decoration: none;
              font-weight: 600;
              padding: 12px 20px;
              border-radius: 25px;
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              border: 2px solid #667eea;
              transition: all 0.3s ease;
            }
            .social-links a:hover {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              transform: translateY(-2px);
              box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
            }
            ul, ol { 
              margin: 15px 0; 
              padding-left: 20px; 
            }
            li { 
              margin-bottom: 8px; 
              line-height: 1.5;
            }
            .emoji {
              font-size: 1.2em;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎉 Welcome to Bondsio!</h1>
            <p class="subtitle">Your early access journey begins now</p>
          </div>
          
          <div class="content">
            <h2>Thank you for joining our community! <span class="emoji">✨</span></h2>
            
            <p>We're thrilled to have you as part of the Bondsio family. You're now among the first to experience our revolutionary platform for building meaningful connections through shared activities.</p>
            


            ${platformInstructions}

            <h2>What makes Bondsio special? <span class="emoji">🌟</span></h2>
            <ul>
              <li><strong>Activity-based matching:</strong> Connect through shared interests and experiences</li>
              <li><strong>Real connections:</strong> No swiping, no superficial interactions</li>
              <li><strong>Community-driven:</strong> Build lasting relationships with like-minded people</li>
              <li><strong>Safe & secure:</strong> Your privacy and safety are our top priorities</li>
            </ul>

            <h2>Stay connected with us <span class="emoji">📱</span></h2>
            <div class="social-links">
              <a href="https://twitter.com/bondsio" target="_blank">Twitter</a>
              <a href="https://instagram.com/bondsio" target="_blank">Instagram</a>
            </div>

            <div class="footer">
              <p>Questions? Contact us at <a href="mailto:info@bondsio.com">info@bondsio.com</a></p>
              <p>© ${new Date().getFullYear()} Bondsio. Building connections, one bond at a time.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: this.generateTextEmail(accessCode, deviceOS),
    }).then(() => {
      console.log(`✅ Welcome email sent to ${to} for early access via ZeptoMail API`);
    }).catch((error) => {
      console.error(`❌ Failed to send welcome email to ${to}:`, error);
      
      // Log error but don't throw - this is background processing
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
        console.warn(`⚠️ Email timeout for ${to} - will retry later`);
      } else if (error.code === 'EAUTH' || error.status === 401) {
        console.error(`🔐 ZeptoMail authentication failed - check ZEPTOMAIL_TOKEN`);
      } else if (error.status === 429) {
        console.warn(`⏰ ZeptoMail rate limit exceeded for ${to} - will retry later`);
      } else {
        console.error(`📧 ZeptoMail API error: ${error.message || error.statusText}`);
      }
    });
    });
  }

  private generatePlatformInstructions(deviceOS?: string[], accessCode?: string): string {
    if (!deviceOS || deviceOS.length === 0) {
      return `
        <h2>Getting Started <span class="emoji">🚀</span></h2>
        <p>We'll send you platform-specific instructions once you let us know which device you'll be using!</p>
      `;
    }

    let instructions = '<h2>Getting Started <span class="emoji">🚀</span></h2>';
    
    if (deviceOS.includes('iOS')) {
      instructions += `
        <div class="platform-section ios-section">
          <h3>🍎 For iOS Users</h3>
          <p>Great choice! Here's how to get started on your iPhone or iPad:</p>
          
          <div class="step">
            <span class="step-number">1</span>
            <strong>Download TestFlight</strong> from the App Store (if you haven't already)
          </div>
          
          <div class="step">
            <span class="step-number">2</span>
            <strong>Wait for your invitation</strong> - We'll add you as a user first, then invite you to TestFlight
          </div>
          
          <div class="step">
            <span class="step-number">3</span>
            <strong>Accept the TestFlight invitation</strong> in your email and tap "Start Testing"
          </div>
          
          <div class="step">
            <span class="step-number">4</span>
            <strong>Download Bondsio</strong> through TestFlight and start connecting!
          </div>
          
          <div class="highlight">
            <strong>⏰ Timeline:</strong> You'll be added as a user first, then receive your TestFlight invitation within 1 hour.
          </div>
        </div>
      `;
    }

    if (deviceOS.includes('Android')) {
      instructions += `
        <div class="platform-section android-section">
          <h3>🤖 For Android Users</h3>
          <p>Perfect! Here's how to get started on your Android device:</p>
          
          <div class="step">
            <span class="step-number">1</span>
            <strong>Click the download link</strong> below to get the Bondsio app
          </div>
          
          <div class="step">
            <span class="step-number">2</span>
            <strong>Install the app</strong> on your Android device
          </div>
          
          <div class="step">
            <span class="step-number">3</span>
            <strong>Open Bondsio</strong> and start connecting with amazing people!
          </div>
          
          <div class="step">
            <span class="step-number">4</span>
            <strong>Start connecting!</strong> Create your profile and discover amazing activities
          </div>
          
          <a href="https://drive.google.com/drive/folders/11BS6J6CJeVG96vX3m3g4G0h51-GYk__N?usp=share_link" class="download-link playstore-link">
            📱 Download for Android
          </a>
        </div>
      `;
    }

    if (deviceOS.length === 2) {
      instructions += `
        <div class="highlight">
          <strong>💡 Multi-platform user!</strong> You can use Bondsio on both iOS and Android. 
          Your account will sync across all your devices, so you'll never miss a connection opportunity.
        </div>
      `;
    }

    return instructions;
  }

  private generateTextEmail(accessCode: string, deviceOS?: string[]): string {
    let text = `
Bondsio - Early Access Welcome!

Thank you for joining our community!

`;

    if (deviceOS && deviceOS.length > 0) {
      text += "GETTING STARTED:\n\n";
      
      if (deviceOS.includes('iOS')) {
        text += `
For iOS Users:
1. Download TestFlight from the App Store
2. Wait for your TestFlight invitation (within 1 hour)
3. Accept the invitation and tap "Start Testing"
4. Download Bondsio through TestFlight
5. Start connecting with amazing people!

`;
      }
      
      if (deviceOS.includes('Android')) {
        text += `
For Android Users:
1. Download Bondsio from: https://drive.google.com/drive/folders/11BS6J6CJeVG96vX3m3g4G0h51-GYk__N?usp=share_link
2. Install the app on your device
3. Open Bondsio and start connecting with amazing people!

`;
      }
    }

    text += `
What makes Bondsio special:
- Activity-based matching through shared interests
- Real connections, no superficial swiping
- Community-driven platform for lasting relationships
- Safe and secure environment

Stay connected:
- Twitter: https://twitter.com/bondsio
- Instagram: https://instagram.com/bondsio

Questions? Contact us at info@bondsio.com

© ${new Date().getFullYear()} Bondsio. Building connections, one bond at a time.
`;

    return text;
  }

  /**
   * Send notification email to admin team when someone signs up for early access
   */
  private async sendEarlyAccessNotification(userEmail: string, deviceOS?: string[]): Promise<void> {
    const fromName = process.env.MAIL_FROM_NAME ?? 'Bondsio';
    const fromAddress = process.env.MAIL_FROM_ADDRESS ?? 'noreply@bondsio.com';
    
    // Get admin notification emails from environment
    const adminEmails = process.env.EARLY_ACCESS_NOTIFICATION_EMAILS;
    if (!adminEmails) {
      return; // No admin emails configured
    }

    const adminEmailList = adminEmails.split(',').map(email => email.trim()).filter(email => email);
    if (adminEmailList.length === 0) {
      return; // No valid admin emails
    }

    const deviceOSStr = deviceOS && deviceOS.length > 0 ? deviceOS.join(', ') : 'Not specified';
    const currentTime = new Date().toLocaleString('en-US', { 
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    try {
      await this.mailService.sendMail({
        to: adminEmailList,
        from: `"${fromName} Notifications" <${fromAddress}>`,
        subject: '🔔 New Early Access Signup - Bondsio',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>New Early Access Signup</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #2c3e50;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
              }
              .container {
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                border-left: 4px solid #667eea;
              }
              h1 { 
                color: #667eea; 
                font-size: 24px; 
                margin: 0 0 20px 0;
                font-weight: 600;
              }
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin: 20px 0;
              }
              .info-item {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                border-left: 3px solid #667eea;
              }
              .info-label {
                font-weight: 600;
                color: #495057;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 5px;
              }
              .info-value {
                color: #2c3e50;
                font-size: 16px;
                font-weight: 500;
              }
              .device-os {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 10px 15px;
                border-radius: 20px;
                display: inline-block;
                font-weight: 600;
                font-size: 14px;
              }
              .timestamp {
                background: #e9ecef;
                color: #6c757d;
                padding: 10px 15px;
                border-radius: 8px;
                font-family: monospace;
                font-size: 14px;
                text-align: center;
                margin: 20px 0;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
                font-size: 14px;
                color: #6c757d;
                text-align: center;
              }
              .stats {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🔔 New Early Access Signup</h1>
              
              <p>A new user has signed up for early access to Bondsio!</p>
              
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">User Email</div>
                  <div class="info-value">${userEmail}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Device OS</div>
                  <div class="info-value">
                    ${deviceOS && deviceOS.length > 0 
                      ? `<span class="device-os">${deviceOS.join(', ')}</span>` 
                      : '<em>Not specified</em>'
                    }
                  </div>
                </div>
              </div>
              
              <div class="timestamp">
                Signup Time: ${currentTime} UTC
              </div>
              
              <div class="stats">
                <strong>📊 Quick Actions:</strong><br>
                • Add to TestFlight (iOS users)<br>
                • Send Android APK link<br>
                • Welcome message via email
              </div>
              
              <div class="footer">
                <p>This is an automated notification from the Bondsio Early Access system.</p>
                <p>© ${new Date().getFullYear()} Bondsio</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
New Early Access Signup - Bondsio

A new user has signed up for early access!

User Email: ${userEmail}
Device OS: ${deviceOSStr}
Signup Time: ${currentTime} UTC

Quick Actions:
• Add to TestFlight (iOS users)
• Send Android APK link  
• Welcome message via email

This is an automated notification from the Bondsio Early Access system.
© ${new Date().getFullYear()} Bondsio
        `,
      });
    } catch (error) {
      // Log error but don't fail the main signup process
      console.error('Failed to send admin notification email:', error);
    }
  }
}