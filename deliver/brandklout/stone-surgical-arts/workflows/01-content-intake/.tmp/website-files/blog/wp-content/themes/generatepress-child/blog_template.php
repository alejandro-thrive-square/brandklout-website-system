<?php /* Template Name: Blog Template */ ?>
<?php get_header(); ?>

<section class="masthead bg-image box-shadow-smooth overflow-hidden" style="--bgImage: url(/assets/img/bg/texture-grey.jpg);">
<div class="masthead__image box-shadow-smooth bg-image bg-position-widescreen " style="--bgImage: url(/assets/img/masthead/auxilary/03.jpg); --bgPosition: 45%;">
  </div>
  <div class="masthead__text text-center mw1200">
    <h1 class="mb0"><span class="title-lg text-marble">Blog</span> <span class="pt20 strikethrough block uppercase subhead white white-pipe">Stone Surgical Arts</span></h1>
  </div>
</section>

<div class="blog_page_section same_padding">
    <div class="container">
        <div class="blog_page_section_row">
            <div class="blog_page_section_col1">
                <div class="blog_page_section_module">
                    <div class="blog_page_section_heading_text htag_txt para_txt">
                        <div class="blog_post_items_order">
                            <?php 
                                $paged = ( get_query_var('page') ) ? get_query_var( 'page' ) : 1;
                                query_posts(array(
                                'post_type' => 'post',
                                    'posts_per_page' => -1,
                                    'post_status' => 'publish',
                                    'paged' => $paged
                                )); ?>
                                <?php
                                while (have_posts()) : the_post(); ?>
                                <div class="blog_post_items_list">
                                    <div class="blog-img">
                                        <?php if ( has_post_thumbnail() ) { ?>
											<?php the_post_thumbnail('full'); ?>
										<?php } else { ?>
											<img width="1140" height="760"
												 src="/assets/img/masthead/auxilary/03.jpg"
												 alt="<?php echo esc_attr( get_the_title() ); ?>" />
										<?php } ?>
                                    </div>
                                    <div class="blog_post_items_details_blk">                                        
                                        <h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
                                        <?php the_excerpt(); ?>
                                    </div>
                                </div>
                            <?php endwhile;?>
                        </div>
                        <div class="pagination justify-content-center">
                            <?php the_posts_pagination(); ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php get_footer(); ?>