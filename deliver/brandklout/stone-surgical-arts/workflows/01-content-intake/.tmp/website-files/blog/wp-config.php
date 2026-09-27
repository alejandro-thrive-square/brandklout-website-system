<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the website, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'stonesurgicalart_db' );

/** Database username */
define( 'DB_USER', 'stonesurgicalart_user' );

/** Database password */
define( 'DB_PASSWORD', 'nfQ}SBXQ(yBYj1ST' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         'SyJ9F<85VF;_KJ~NH#%KKh.U3-Azj=wH2r3MbR;7[IKb!&?[0[~-FV%!g#l!4kMH' );
define( 'SECURE_AUTH_KEY',  'l=7D0F-c7FU)=?=%!#rSjWX#thC13pLWECy`VtA1dj7bwJ~0UdEf s*o~6siysD.' );
define( 'LOGGED_IN_KEY',    '~|C>qXpE>QK[iU1Ne!h@Vz7{t6o]{1LyGcI:q}=`mg!U,i$*{FhU9o2%s>qn+Srm' );
define( 'NONCE_KEY',        'L93w_k#,K(I$,NuTP87xKM+aycL>k(c=R3V= T| k3M@|*P)t,mYQZ_ns#_>eGqK' );
define( 'AUTH_SALT',        'xBj~lWc(WA>dWzoHOa!TU58;.~YPnzEFF6SK6gkYhs)k|>;~+fI2qSyQ<jRRnnX?' );
define( 'SECURE_AUTH_SALT', 'L8IisoOr3&QyWmI)J^B.rx*,v;?GK?QTw(U0MV=+CqrT@bowI:c7$=v}aJjQT,p(' );
define( 'LOGGED_IN_SALT',   'pz @Qq9T{]<OKzQqvTnnS&teM0~pPy[1:/Pb6I,(i(|yv~)R(~Z4OuGkZ[Kb_2/}' );
define( 'NONCE_SALT',       '+|Ar)?%K%X>&,E7IP8y~L7V*E=Ke4WyZD di{YSa|]3NW;m:rtHe26#o5+]YV@C4' );

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 *
 * At the installation time, database tables are created with the specified prefix.
 * Changing this value after WordPress is installed will make your site think
 * it has not been installed.
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/#table-prefix
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://developer.wordpress.org/advanced-administration/debug/debug-wordpress/
 */
define( 'WP_DEBUG', false );

/* Add any custom values between this line and the "stop editing" line. */



/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
