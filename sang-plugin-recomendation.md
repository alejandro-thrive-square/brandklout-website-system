I think we’ll need to build our own extension or tool
Got it, hosting on Railway makes things straightforward since your live domain is automatically generated or linked there. Because Railway serves your project directly from a container or static deployment, you just need to ensure the image file is correctly bundled in your repository and served publicly.
Here is how to structure your Open Graph photo specifically for a site deployed on Railway:
1. Match Your Railway Domain
Your Open Graph tags must use your live, public Railway URL. If you are using Railway's default domain, it will look like https://railway.app.
Open your Railway Dashboard.
Go to your service's Settings tab.
Look under Networking to grab your exact domain.
2. Put the Image in Your Public Directory
Make sure your image is stored in the folder your website serves as static assets.
For Node.js/Express: Put it in your public or assets folder (e.g., public/og-image.png).
For Python/Flask: Put it in your static folder (e.g., static/og-image.png).
For HTML/Static sites: Put it right in your root directory or an images folder next to your index.html.
3. Use the Absolute Railway URL in Your Code
Update your HTML head to point directly to your live Railway domain. Do not use relative paths like /og-image.png.
&lt;!-- Replace with your actual Railway domain or custom domain --&gt;
&lt;meta property="og:image" content="https://railway.app" /&gt;
&lt;meta property="og:url" content="https://railway.app" /&gt;
&lt;!-- Twitter Fallback --&gt;
&lt;meta name="twitter:image" content="https://railway.app" /&gt;
4. Push to GitHub to Deploy
Commit the image and code changes to your repository. Railway will automatically detect the commit, build the project, and update your live site.
Once the Railway deployment status turns green, you can immediately test it using a tool like OpenGraph.xyz by pasting your up.railway.app link.
What language or framework (like Node.js, Python, or Go) is your Railway service running? If your app uses environment variables for domains, I can show you how to inject the Railway URL dynamically.



To set up an Open Graph photo on Instatic CMS hosted on Railway, you need to configure the properties inside the CMS's visual dashboard or inject custom HTML into the site settings panel. Since Instatic compile-publishes pure semantic HTML, the settings must route through its built-in builder or site management options. [1]
Follow these steps to configure your OG Image in Instatic:
1. Upload Your OG Photo to Instatic Media
Log in to your Instatic CMS dashboard (e.g., https://railway.app or your custom domain).
Navigate to the Media tab on the left sidebar.
Upload your standard 1200x630 pixel image.
Once uploaded, click on the image and copy its absolute URL. (It should look like https://yourdomain.com).[2, 3, 4, 5]
2. Add the Code into Instatic's Site Settings
Because Instatic acts as a full website management platform, you can apply global head tags via the site configuration panels:
Open the left-hand panel and click on Site Settings (or Site Identity).
Look for a section labeled Custom Code, Global Header, or SEO Settings.
Paste your Open Graph &lt;meta&gt; properties into the header section field: [2, 6]
&lt;!-- Open Graph Meta Tags --&gt;
&lt;meta property="og:title" content="Your Website Title" /&gt;
&lt;meta property="og:description" content="A brief description of your site." /&gt;
&lt;meta property="og:image" content="PASTE_YOUR_COPIED_MEDIA_URL_HERE" /&gt;
&lt;meta property="og:url" content="https://your-project.up.railway.app/" /&gt;
&lt;meta property="og:type" content="website" /&gt;
&lt;!-- Twitter Card --&gt;
&lt;meta name="twitter:card" content="summary_large_image" /&gt;
&lt;meta name="twitter:title" content="Your Website Title" /&gt;
&lt;meta name="twitter:description" content="A brief description of your site." /&gt;
&lt;meta name="twitter:image" content="PASTE_YOUR_COPIED_MEDIA_URL_HERE" /&gt;
Note: If Instatic introduces standalone visual text fields explicitly for "Open Graph Title" and "Open Graph Image" under its page settings, you can simply paste the image URL directly into that visual input box instead of using HTML code. [7]
3. Hit Publish to Bake the Changes
Instatic processes pages atomically—it saves designs in its SQLite/Postgres database and renders flat HTML files only when you tell it to. [2, 8]

Click the Publish button in the dashboard to push your changes live. [8]
4. Clear Social Media Caches
Social networks cache link data intensely. If your old or blank preview still appears after publishing, visit the Facebook Sharing Debugger or LinkedIn Post Inspector and type in your Railway domain. Click "Scrape Again" / "Inspect" to force the platforms to look at your newly published Instatic HTML. [9]
