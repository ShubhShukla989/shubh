-- Sample Pages for ePaper CMS
-- Run this in your Supabase SQL Editor to create example pages

-- 1. About Us Page (Full featured example)
INSERT INTO pages (
  title,
  alias,
  description,
  content,
  status,
  meta_title,
  meta_description,
  meta_keywords,
  og_image,
  twitter_title,
  twitter_description,
  twitter_image,
  header_code,
  footer_code
) VALUES (
  'About Us',
  'about-us',
  'Company information and team details',
  '<h2>Welcome to ePaper CMS Cloud</h2>
<p>We are a leading provider of digital newspaper publishing solutions, helping publishers transition from print to digital with ease.</p>

<h3>Our Mission</h3>
<p>To empower publishers with cutting-edge technology that makes digital newspaper publishing simple, efficient, and accessible to everyone.</p>

<h3>What We Offer</h3>
<ul>
  <li><strong>Easy Content Management</strong> - Create and manage pages with our intuitive WYSIWYG editor</li>
  <li><strong>SEO Optimization</strong> - Built-in tools to improve your search engine rankings</li>
  <li><strong>Responsive Design</strong> - Your content looks great on all devices</li>
  <li><strong>PDF Publishing</strong> - Upload and manage newspaper editions in PDF format</li>
  <li><strong>Interactive Features</strong> - Add clickable areas and links to your newspaper pages</li>
</ul>

<h3>Our Team</h3>
<p>We are a dedicated team of developers, designers, and publishing experts committed to revolutionizing digital newspaper publishing.</p>

<blockquote>
  <p>"ePaper CMS has transformed how we publish our daily newspaper. The platform is intuitive, powerful, and our readers love it!"</p>
  <footer>— John Smith, Editor-in-Chief</footer>
</blockquote>

<h3>Get Started Today</h3>
<p>Ready to transform your publishing workflow? <a href="/page/contact">Contact us</a> to learn more about how ePaper CMS can help your organization.</p>',
  'Public',
  'About Us - ePaper CMS Cloud | Digital Publishing Solutions',
  'Learn about ePaper CMS Cloud, the leading digital newspaper publishing platform. Discover our mission, features, and how we help publishers succeed.',
  'about us, digital publishing, newspaper cms, epaper, publishing platform, content management',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=630',
  'About ePaper CMS Cloud',
  'Discover how ePaper CMS is revolutionizing digital newspaper publishing with cutting-edge technology.',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=630',
  '<!-- Google Analytics Example -->
<!-- <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script> -->',
  '<!-- Additional tracking or chat widgets can go here -->'
);

-- 2. Contact Page
INSERT INTO pages (
  title,
  alias,
  description,
  content,
  status,
  meta_title,
  meta_description,
  meta_keywords
) VALUES (
  'Contact Us',
  'contact',
  'Get in touch with our team',
  '<h2>Get In Touch</h2>
<p>We''d love to hear from you! Whether you have questions about our platform, need technical support, or want to discuss how ePaper CMS can help your organization, our team is here to help.</p>

<h3>Contact Information</h3>
<div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <p><strong>Email:</strong> <a href="mailto:info@epapercms.com">info@epapercms.com</a></p>
  <p><strong>Phone:</strong> +1 (555) 123-4567</p>
  <p><strong>Address:</strong> 123 Publishing Street, Digital City, DC 12345</p>
  <p><strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM EST</p>
</div>

<h3>Support</h3>
<p>For technical support, please email <a href="mailto:support@epapercms.com">support@epapercms.com</a> or visit our <a href="/admin">admin panel</a> for documentation.</p>

<h3>Sales Inquiries</h3>
<p>Interested in ePaper CMS for your organization? Contact our sales team at <a href="mailto:sales@epapercms.com">sales@epapercms.com</a> for a personalized demo.</p>

<h3>Follow Us</h3>
<p>Stay updated with the latest news and features:</p>
<ul>
  <li>Twitter: <a href="https://twitter.com/epapercms" target="_blank">@epapercms</a></li>
  <li>LinkedIn: <a href="https://linkedin.com/company/epapercms" target="_blank">ePaper CMS</a></li>
  <li>GitHub: <a href="https://github.com/epapercms" target="_blank">github.com/epapercms</a></li>
</ul>',
  'Public',
  'Contact Us - ePaper CMS Cloud',
  'Get in touch with the ePaper CMS team. We''re here to help with questions, support, and sales inquiries.',
  'contact, support, help, email, phone, customer service'
);

-- 3. Privacy Policy Page
INSERT INTO pages (
  title,
  alias,
  description,
  content,
  status,
  meta_title,
  meta_description,
  meta_keywords
) VALUES (
  'Privacy Policy',
  'privacy-policy',
  'Our privacy policy and data handling practices',
  '<h2>Privacy Policy</h2>
<p><em>Last Updated: {{current_year}}</em></p>

<h3>Introduction</h3>
<p>At {{site_name}}, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.</p>

<h3>Information We Collect</h3>
<p>We collect information that you provide directly to us, including:</p>
<ul>
  <li>Account information (name, email, password)</li>
  <li>Content you create and publish</li>
  <li>Usage data and analytics</li>
  <li>Communication preferences</li>
</ul>

<h3>How We Use Your Information</h3>
<p>We use the information we collect to:</p>
<ul>
  <li>Provide, maintain, and improve our services</li>
  <li>Process your transactions and send related information</li>
  <li>Send you technical notices and support messages</li>
  <li>Respond to your comments and questions</li>
  <li>Monitor and analyze trends and usage</li>
</ul>

<h3>Data Security</h3>
<p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

<h3>Your Rights</h3>
<p>You have the right to:</p>
<ul>
  <li>Access your personal information</li>
  <li>Correct inaccurate data</li>
  <li>Request deletion of your data</li>
  <li>Object to processing of your data</li>
  <li>Export your data</li>
</ul>

<h3>Cookies</h3>
<p>We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>

<h3>Third-Party Services</h3>
<p>We may employ third-party companies and individuals to facilitate our service, provide the service on our behalf, or assist us in analyzing how our service is used.</p>

<h3>Changes to This Policy</h3>
<p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>

<h3>Contact Us</h3>
<p>If you have questions about this Privacy Policy, please contact us at <a href="/page/contact">our contact page</a> or email <a href="mailto:privacy@epapercms.com">privacy@epapercms.com</a>.</p>',
  'Public',
  'Privacy Policy - ePaper CMS Cloud',
  'Read our privacy policy to understand how we collect, use, and protect your personal information.',
  'privacy policy, data protection, gdpr, personal information, data security'
);

-- 4. Features Page
INSERT INTO pages (
  title,
  alias,
  description,
  content,
  status,
  meta_title,
  meta_description,
  meta_keywords
) VALUES (
  'Features',
  'features',
  'Explore all the powerful features of ePaper CMS',
  '<h2>Powerful Features for Modern Publishing</h2>
<p>ePaper CMS Cloud provides everything you need to create, manage, and publish digital newspapers with ease.</p>

<h3>📝 Content Management</h3>
<ul>
  <li><strong>WYSIWYG Editor</strong> - Create beautiful content with our intuitive rich text editor</li>
  <li><strong>Media Library</strong> - Upload and manage images, videos, and documents</li>
  <li><strong>Page Templates</strong> - Use pre-designed templates or create your own</li>
  <li><strong>Draft System</strong> - Work on content before publishing</li>
</ul>

<h3>🔍 SEO Optimization</h3>
<ul>
  <li><strong>Meta Tags</strong> - Customize title, description, and keywords</li>
  <li><strong>Open Graph</strong> - Optimize for social media sharing</li>
  <li><strong>Twitter Cards</strong> - Beautiful previews on Twitter</li>
  <li><strong>Custom Code</strong> - Add tracking scripts and custom CSS/JS</li>
</ul>

<h3>📰 Edition Management</h3>
<ul>
  <li><strong>PDF Upload</strong> - Upload newspaper editions in PDF format</li>
  <li><strong>Page Extraction</strong> - Automatically extract pages from PDFs</li>
  <li><strong>Interactive Areas</strong> - Add clickable regions to newspaper pages</li>
  <li><strong>Archive System</strong> - Organize editions by date and category</li>
</ul>

<h3>🎨 Design & Layout</h3>
<ul>
  <li><strong>Responsive Design</strong> - Looks great on all devices</li>
  <li><strong>Page Designer</strong> - Drag-and-drop layout builder</li>
  <li><strong>Widget System</strong> - Add text, images, videos, and more</li>
  <li><strong>Custom Themes</strong> - Match your brand identity</li>
</ul>

<h3>👥 User Management</h3>
<ul>
  <li><strong>Role-Based Access</strong> - Control who can do what</li>
  <li><strong>Multiple Users</strong> - Collaborate with your team</li>
  <li><strong>Audit Logs</strong> - Track all changes and actions</li>
  <li><strong>Permissions</strong> - Fine-grained access control</li>
</ul>

<h3>🚀 Performance</h3>
<ul>
  <li><strong>Fast Loading</strong> - Optimized for speed</li>
  <li><strong>CDN Support</strong> - Global content delivery</li>
  <li><strong>Caching</strong> - Smart caching for better performance</li>
  <li><strong>Scalable</strong> - Grows with your needs</li>
</ul>

<h3>🔒 Security</h3>
<ul>
  <li><strong>HTTPS</strong> - Secure connections</li>
  <li><strong>Authentication</strong> - Secure login system</li>
  <li><strong>Backups</strong> - Regular automated backups</li>
  <li><strong>Updates</strong> - Regular security updates</li>
</ul>

<h3>Ready to Get Started?</h3>
<p>Explore these features yourself by visiting our <a href="/admin">admin panel</a> or <a href="/page/contact">contact us</a> for a personalized demo.</p>',
  'Public',
  'Features - ePaper CMS Cloud | Digital Publishing Platform',
  'Discover the powerful features of ePaper CMS Cloud including content management, SEO optimization, edition management, and more.',
  'features, cms features, digital publishing, content management, seo, newspaper cms'
);

-- 5. Getting Started Guide
INSERT INTO pages (
  title,
  alias,
  description,
  content,
  status,
  meta_title,
  meta_description,
  meta_keywords
) VALUES (
  'Getting Started',
  'getting-started',
  'Quick start guide for new users',
  '<h2>Getting Started with ePaper CMS</h2>
<p>Welcome! This guide will help you get up and running with ePaper CMS Cloud in just a few minutes.</p>

<h3>Step 1: Access the Admin Panel</h3>
<p>Navigate to the <a href="/admin">admin panel</a> and log in with your credentials.</p>

<h3>Step 2: Create Your First Page</h3>
<ol>
  <li>Go to <strong>Pages</strong> in the sidebar</li>
  <li>Click the <strong>Create</strong> button</li>
  <li>Enter a page title (e.g., "About Us")</li>
  <li>The URL alias will be generated automatically</li>
  <li>Add your content using the rich text editor</li>
  <li>Set the status to <strong>Public</strong></li>
  <li>Click <strong>Save</strong></li>
</ol>

<h3>Step 3: Optimize for SEO</h3>
<ol>
  <li>Expand the <strong>Search Engine Optimization</strong> section</li>
  <li>Fill in the <strong>Basic</strong> tab with meta title and description</li>
  <li>Add <strong>Open Graph</strong> tags for social sharing</li>
  <li>Configure <strong>Twitter Cards</strong> for Twitter previews</li>
  <li>Save your changes</li>
</ol>

<h3>Step 4: Add to Navigation</h3>
<p>After saving, you''ll be prompted to add the page to your site navigation:</p>
<ol>
  <li>Select a menu location (e.g., Main Navigation)</li>
  <li>Choose the position (Start, End, or After specific item)</li>
  <li>Set visibility (Public, Logged-in, or Role-based)</li>
  <li>Click <strong>Add to Menu</strong></li>
</ol>

<h3>Step 5: Upload an Edition</h3>
<ol>
  <li>Go to <strong>Epaper → All Editions</strong></li>
  <li>Click <strong>Create Edition</strong></li>
  <li>Fill in the edition details</li>
  <li>Upload your PDF file</li>
  <li>The system will extract pages automatically</li>
  <li>Add interactive areas to pages (optional)</li>
</ol>

<h3>Tips for Success</h3>
<ul>
  <li>Use <strong>Draft</strong> status to work on content before publishing</li>
  <li>Fill all SEO fields for better search engine rankings</li>
  <li>Use descriptive page titles and URLs</li>
  <li>Optimize images before uploading</li>
  <li>Test on mobile devices</li>
  <li>Keep content updated regularly</li>
</ul>

<h3>Need Help?</h3>
<p>If you have questions or need assistance:</p>
<ul>
  <li>Check the documentation in the admin panel</li>
  <li>Visit our <a href="/page/contact">contact page</a></li>
  <li>Email support at <a href="mailto:support@epapercms.com">support@epapercms.com</a></li>
</ul>

<h3>What''s Next?</h3>
<p>Now that you''re familiar with the basics, explore more features:</p>
<ul>
  <li><a href="/page/features">View all features</a></li>
  <li><a href="/admin/designer">Try the Page Designer</a></li>
  <li><a href="/admin/media">Manage your media library</a></li>
  <li><a href="/admin/system/menus">Customize your menus</a></li>
</ul>',
  'Public',
  'Getting Started - ePaper CMS Cloud',
  'Learn how to get started with ePaper CMS Cloud. Step-by-step guide for creating pages, optimizing SEO, and publishing content.',
  'getting started, tutorial, guide, how to, quick start, documentation'
);

-- Verify the pages were created
SELECT id, title, alias, status, created_at 
FROM pages 
ORDER BY created_at DESC;
