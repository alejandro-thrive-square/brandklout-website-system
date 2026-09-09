<?php
/**
 * The template for displaying singular post types: posts, pages, and custom post types.
 *
 * @package HelloElementor
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

get_header();

while ( have_posts() ) :
	the_post();
?>

<main id="content" <?php post_class( 'site-main' ); ?>>
	<section class="blog-single-section mb-4 mb-md-5 pt-3" style="padding-bottom: 40px;">
		<div class="container">
		
		<?php if ( apply_filters( 'hello_elementor_page_title', true ) ) : ?>
			<div class="page-header px-0" style="text-align: center">
				<h1 class="entry-title"><?php the_title(); ?></h1>
			</div>
		<?php endif; ?>
		 
		<?php if ( has_post_thumbnail() ) : ?>
			<div class="post-thumbnail" style="width: fit-content;margin: 0 auto;">
				<?php the_post_thumbnail( 'large' ); ?>
			</div>
		<?php endif; ?>

		<div class="post-info">
			<p class="post-meta"><span class="label">Published On:</span> <?php echo get_the_date('F j, Y'); ?> | <span class="label">Categories:</span> <?php the_category(', '); ?></p>
		</div>

		<div class="page-content mt-0">
			<?php the_content(); ?>

			<!--<?php wp_link_pages(); ?>-->

			<!--<?php if ( has_tag() ) : ?>-->
			<!--	<div class="post-tags">-->
			<!--		<?php the_tags( '<span class="tag-links">' . esc_html__( 'Tagged ', 'hello-elementor' ) . ': ', ', ', '</span>' ); ?>-->
			<!--	</div>-->
			<!--<?php endif; ?>-->
		</div>

		<!-- <-?php comments_template(); ?> -->
		</div>
	</section>
	
	<div class="mw800" style="margin-bottom: 60px;">
      <div class="card bg-image animate fadeInBg bg-marble animated">
        <p class="accent-color animate fadeIn animated"><strong>Oral and Maxillofacial surgeon Dr. Mona Stone offers a range of cosmetic plastic surgery options in Westlake, Texas, including chin implant, eyelid lift, neck liposuction, facelift, wisdom tooth extractions, dental implants, facial and oral surgery and also to:</strong>
        </p>
        <p class="animate fadeIn animated"><strong>Irving • Grapevine • Keller • Fort Worth • Southlake • Roanoke • North Richland Hills • Coppell • Trophy Club • Colleyville • Dallas • Watauga • Bedford • Euless • Hurst • Flower Mound • Double Oak • Corinth • Argyle • Denton</strong></p>
      </div>
    </div>
</main>

<?php
endwhile;

get_footer();
?>
