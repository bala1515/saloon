# Render + Aiven MySQL

The website remains a Rails + React + Vite web service. Production connections use Aiven over TCP with TLS and CA verification. Development/test database configuration is unchanged. The existing Rails cache/queue/cable databases are preserved.

## 1. Aiven

Create an **Aiven for MySQL Free** service and wait for Running. Keep its real host, port, username and password from Connection information. Use the exact port Aiven supplies, not an assumed 3306.

Download the service/project **CA certificate**. Its contents should be a PEM certificate. Do not upload a private key. The app uses `ssl_mode: verify_ca`: it validates the CA chain; it does not claim hostname verification with every MySQL/MariaDB client library.

The app expects four logical databases within this one MySQL service (not four paid services):

- `defaultdb` (or the value you put in DB_NAME)
- `saloon_production_cache`
- `saloon_production_queue`
- `saloon_production_cable`

`db:prepare` creates missing databases and loads their existing schemas if your Aiven user has the necessary privileges. If creation is denied, create these databases through Aiven's database management or an authorized MySQL connection, then redeploy. Do not point development/test at these production databases.

## 2. Render

Push this project, including package-lock.json, model assets, Dockerfile and the deployment changes, to your own Git repository. In Render create a **Web Service**, connect that repository, and choose **Docker** with the root Dockerfile. This is not a Static Site deployment. Use `/up` as the health check path. Keep the Docker command override empty.

Add these environment variables on the service's Environment page:

| Key | Value |
| --- | --- |
| RAILS_ENV | production |
| PORT | 10000 |
| RAILS_SERVE_STATIC_FILES | true |
| RAILS_MAX_THREADS | 3 |
| DB_HOST | Aiven's actual hostname |
| DB_PORT | Aiven's actual port |
| DB_USERNAME | Aiven's actual user |
| DB_PASSWORD | Aiven's actual password |
| DB_NAME | defaultdb, or your chosen existing primary database |
| DB_CACHE_NAME | saloon_production_cache |
| DB_QUEUE_NAME | saloon_production_queue |
| DB_CABLE_NAME | saloon_production_cable |
| DB_SSL_CA | /etc/secrets/aiven-ca.pem |
| RAILS_MASTER_KEY | Your own config/master.key value |
| SECRET_KEY_BASE | A new value generated locally with bin/rails secret |

Do not paste passwords or Rails keys into chat or source control. Do not set SECRET_KEY_BASE_DUMMY in Render: the Docker build uses it only while compiling assets. Remove any stale DATABASE_URL, PRIMARY_DATABASE_URL, CACHE_DATABASE_URL, QUEUE_DATABASE_URL or CABLE_DATABASE_URL values from this service because Rails connection URLs can override individual settings. Leave SOLID_QUEUE_IN_PUMA unset for this landing page; it currently has no background job workflow.

In **Environment -> Secret Files**, add a file named **aiven-ca.pem** containing the downloaded CA certificate. Render exposes it at `/etc/secrets/aiven-ca.pem`. Do not add the certificate to the Docker image.

Save and deploy. The image installs Node 22 and npm dependencies, compiles Rails/Vite assets, and starts Puma on 0.0.0.0:$PORT. The entrypoint checks required database settings and the CA file, then runs `db:prepare` before starting Rails.

## 3. Verify after deployment

- Check build logs for a successful Vite build and deployment logs for successful database preparation/server startup.
- Open `/up`, then `/`: the hero, real 3D models, gallery, review controls and location links should load.
- In browser Network check model files under `/models/` and Vite assets return 200.
- If Aiven network access is restricted, allow this Render service's documented outbound addresses rather than guessing host/port values.
- Aiven free services can be powered off for inactivity. A Render free web service also has its own free-plan limits; a free database does not change those limits.

Live connectivity and the Docker image must be verified with your actual Aiven/Render service. Preparing these files does not publish the site or prove that the remote credentials work.

Official references:
- https://aiven.io/docs/products/mysql/concepts/mysql-free-tier
- https://aiven.io/docs/platform/concepts/tls-ssl-certificates
- https://render.com/docs/docker
- https://render.com/docs/configure-environment-variables
- https://render.com/docs/web-services

## Local verification performed

- Database config tests: 3 runs, 36 assertions, no failures. Credentials with special characters round-trip safely; TLS, names and local-development config checked without a live connection.
- Entrypoint Bash syntax, non-server pass-through and missing-environment failure path checked.
- Rails `RAILS_ENV=production SECRET_KEY_BASE_DUMMY=1 bin/rails assets:precompile` passed, including Vite. Existing JavaScript chunk-size warning remains. Local libvips warning was emitted; the Dockerfile installs libvips.
- Docker is not installed in this WSL environment, so the final Docker image was not built locally. Aiven networking, CA validity, database creation privileges and Render deployment remain unverified until your service credentials/certificate are configured.

## net-pop lockfile repair

Ruby 3.3.3 shipped a bundled net-pop 0.1.2 gemspec with missing dependency metadata (https://bugs.ruby-lang.org/issues/20581). This project's lockfile was missing `net-protocol` beneath `net-pop (0.1.2)`. That dependency edge has been restored without changing gem versions. A generic `bundle update net-pop` on the affected Ruby install can reproduce the omission, so do not regenerate the lockfile blindly.

Verified with a fresh isolated Linux production bundle (Ruby 3.3.3 / Bundler 2.5.11): 97 gems installed successfully with BUNDLE_DEPLOYMENT=true, BUNDLE_FROZEN=true and development/test excluded. `bundle check`, Bootsnap gem precompile and production asset precompile passed; Vite reused its current compiled assets. The corrected lockfile stayed byte-for-byte unchanged. This is not a complete Docker-image or live Aiven connection test.

Commit/push Gemfile.lock before redeploying. The newly repaired config/credentials.yml.enc also needs to be pushed together with setting its matching, new RAILS_MASTER_KEY in Render. Never commit config/master.key. A cached dependency layer is automatically invalidated when the copied lockfile changes.
