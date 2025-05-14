# Checklist

If you just created a project from the
[gadfly_flutter_template](https://github.com/gadfly361/gadfly_flutter_template),
then you still have a few manual things to do before the project is ready.

## Step 0: Make sure your computer's setup is ready for development

See
[docs/developer_setup/prerequisites.md](http://localhost:8000/developer_setup/prerequisites.html).

## Step 1: Update production supabase

### Create supabase project

Make a new project in supabase

Go to [Supabase.com](https://supabase.com) and create a new project.

### Update your site_url and redirect_urls

If you only have a mobile application, then you can change your site URL to be a
deep link to your application like this:

![Supabase site url](images/supabase_site_url.png?raw=true)

If you have an application and a website, then you'd want your site url to be
your website, and then add the deep link to your application as an additional
redirect url.

### Link your local supabase project with your production account

Sign in to Supabase:

```sh
supabase login
# Follow prompt to sign in
```

Link your supabase project:

```sh
supabase link
# Select your project from list
```

## Step 2: Update your app's configuration file

Go to `app/lib/configurations/*.dart` and replace all the `CHANGE_ME` texts with
your credentials.

For the **production** build use these:

### Supabase Credentials

![Supabase credentials](images/supabase_credentials.png?raw=true)

### Sentry Credentials

![Sentry DSN](images/sentry_dsn.png?raw=true)

![Sentry environment](images/sentry_environment.png?raw=true)

### SMTP Server Credentials

You will need to set up an SMTP server with supabase. For example, you can use
[mailersend](https://mailersend.com).

![MailerSend SMTP](images/mailersend.png?raw=true)

![Supabase SMTP](images/supabase_smtp.png?raw=true)

## Step 3: android directory

### Deep links on android

Update `app/android/app/src/main/AndroidManifest.xml` to include the following:

```xml
<manifest ...>
  <!-- ... other tags -->
  <application ...>
    <activity ...>
      <!-- ... other tags -->

      <!-- Add this intent-filter for Deep Links -->
      <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <!-- Accepts URIs that begin with YOUR_SCHEME://YOUR_HOST -->
        <!-- CHANGE_ME: change scheme before going to production -->
        <data
          android:scheme="com.gadfly361.gadflyfluttertemplate.deep"
          android:host="deeplink-callback" />
      </intent-filter>

    </activity>
  </application>
</manifest>
```

## Step 4: iOS directory

### Deep links in iOS

Update `app/ios/Runner/Info.plist` to include the following:

```xml
<!-- ... other tags -->
<plist>
<dict>
  <!-- ... other tags -->

  <!-- Add this array for Deep Links -->
  <key>CFBundleURLTypes</key>
  <array>
    <dict>
      <key>CFBundleTypeRole</key>
      <string>Editor</string>
      <key>CFBundleURLSchemes</key>
      <array>
      <!-- CHANGE_ME before going to production -->
        <string>com.gadfly361.gadflyfluttertemplate.deep</string>
      </array>
    </dict>
  </array>
  <!-- ... other tags -->
</dict>
</plist>
```

## Step 5: Supabase directory

### Deep links in supabase

Update the redirect links in `supabase/config.toml` under the `[auth]` section:

```toml
site_url = "env(SITE_URL_HTTP)"
# A list of *exact* URLs that auth providers are permitted to redirect to post authentication.
additional_redirect_urls = [
  # For Web (catch all)
  "env(SITE_URL_HTTPS)",
  # For Mobile (needs to be individually specified)
  "com.gadfly361.gadflyfluttertemplate.deep://deeplink-callback/#/deep/reset-password/",
  "com.gadfly361.gadflyfluttertemplate.deep://deeplink-callback/#/deep/verify-email/",
]
```

Require email confirmation after signup under the `[auth.email] section:

```toml
enable_confirmations = true
```

## Step 6: misc cleanup

### Deep links cleanup

Finally, do a search and replace for `com.gadfly361.gadflyfluttertemplate.deep"`
and replace it with the name of your project. For example
`com.my-company.my-application-name.deep` (in kebab-case).

*Note: make sure to exclude the `docs/` directory in your search and replace.
Otherwise it will update this file as well.

### Add your local ip address to `.env` file and source from `.envrc`

Create a `.env` file and add the following to `.env`, but replace the ip address
with your own:

```env
# Used in `.vscode/launch.json `
export SITE_HOST="192.168.0.00"

# Used in `supabase/config.toml`
export SITE_URL_HTTP="http://$SITE_HOST:3000"
export SITE_URL_HTTPS="https://$SITE_HOST:3000"

# Used in `supabase/functions/`
export EDGE_FUNCTION_SECRET="my-edge-function-secret" # needs to match `supabase/seed.sql`
```

**Note**: The reason we have both a `.env` file and `.envrc` file is because
supabase's `config.toml` file expects environment variables in `.env`, while
direnv expects environment variables in `.envrc`. So we have decided to define
our environment variables in `.env` and source them from `.envrc`. As a
consequence, we are only ignoring `.env` from version control.

_Reminder, be sure to download the
[VSCode direnv extension](https://marketplace.visualstudio.com/items?itemName=mkhl.direnv)._

## Step 7: Configure Firebase with FlutterFire

Before running the FlutterFire CLI, you need to install it globally. Run the
following command:

```sh
dart pub global activate flutterfire_cli
```

Then, set up Firebase for your Flutter project by running:

```sh
cd app
flutterfire configure
```

Follow the interactive instructions to select your Firebase project and
platforms. This will create or update the `firebase_options.dart` file and any
required native configuration files.

For more details, see the
[FlutterFire documentation](https://firebase.flutter.dev/docs/cli/).
