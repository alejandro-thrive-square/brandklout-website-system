# Finsweet Client-First — Full Documentation (V2)

> Extracted from https://finsweet.com/client-first/docs on 2026-07-18.
> One section per docs page, in official nav order. Source URL noted at the top of each section.

## Table of Contents

1. [Client-First quick guide](#client-first-quick-guide) — `quick-guide`
2. [Intro](#intro) — `intro`
3. [Big docs](#big-docs) — `big-docs`
4. [Classes strategy 1](#classes-strategy-1) — `classes-strategy-1`
5. [Core Structure strategy](#core-structure-strategy) — `core-structure-strategy`
6. [Sizes and rem](#sizes-and-rem) — `sizes-and-rem`
7. [Typography strategy](#typography-strategy) — `typography-strategy`
8. [Spacing strategy](#spacing-strategy) — `spacing-strategy`
9. [Utility class systems](#utility-class-systems) — `utility-class-systems`
10. [Classes strategy 2](#classes-strategy-2) — `classes-strategy-2`
11. [Folders](#folders) — `folders`
12. [Folders strategy](#folders-strategy) — `folders-strategy`
13. [Interactions naming](#interactions-naming) — `interactions-naming`
14. [Variables](#variables) — `variables`
15. [Fluid responsive](#fluid-responsive) — `fluid-responsive`
16. [Semantic HTML tags](#semantic-html-tags) — `semantic-html-tags`
17. [Accessibility](#accessibility) — `accessibility`
18. [Learning path](#learning-path) — `learning-path`
19. [CSS specificity](#css-specificity) — `css-specificity`
20. [Sales strategy](#sales-strategy) — `sales-strategy`
21. [Client-First productivity](#client-first-productivity) — `productivity-client-first`
22. [Webflow productivity](#webflow-productivity) — `productivity-webflow`
23. [Beginners in Webflow](#beginners-in-webflow) — `beginners`
24. [Webflow resources](#webflow-resources) — `webflow-resources`
25. [Changelog](#changelog) — `changelog`
26. [Board of Directors](#board-of-directors) — `board-of-directors`
27. [Become a Translator](#become-a-translator) — `become-a-translator`
28. [Global Styles embed](#global-styles-embed) — `global-styles-embed`
29. [V1 to V2 guide](#v1-to-v2-guide) — `v1-to-v2`

---

<!-- source: https://finsweet.com/client-first/docs/quick-guide -->

GETTING STARTED

## Client-First quick guide

The most important topics of Client-First.

[Download Quick Guide](https://www.dropbox.com/scl/fi/ru64skvc3jpclkq576w9r/Client-First-Quick-Guide.pdf?rlkey=ie9uq0glgwhckuslletgwmqsp&dl=1)

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/660afe577cc432c0108179a0_client-first-quickguide0104.webp)

[Download Quick Guide](https://www.dropbox.com/scl/fi/ru64skvc3jpclkq576w9r/Client-First-Quick-Guide.pdf?rlkey=ie9uq0glgwhckuslletgwmqsp&dl=1)

---

<!-- source: https://finsweet.com/client-first/docs/intro -->

GETTING STARTED

## Intro

Intro to Client-First with an overview of the essential principles.

### Client-First overview

###### 👉 This is a short overview to understand the core parts of Client-First. Read the [full documentation](https://finsweet.com/client-first/docs) for the complete learning experience.

###### **New to Webflow?** Before learning Client-First, we recommend learning the basics of Webflow. Client-First does not teach HTML or CSS. It's important to have a beginner-level understanding of these topics before learning Client-first. Read our [Beginners in Webflow](https://finsweet.com/client-first/docs/beginners).

#### Goals of Client-First

1. To create an organization system for our project
2. To enable speed and flexibility when using Webflow Designer
3. To define a strategy for class usage in the project
4. To standardize a core structure shared across all pages
5. To create a Webflow build that is scalable and easily manageable
6. To help developers, clients, or anyone understand the project

#### What does "Client-First" mean?

###### Client-First = We put our clients' interests first in the Webflow build process.

By making our clients our top priority, we have created a style system that satisfies their needs and makes us better Webflow developers.

##### Most clients want us to

1. Create a scalable Webflow project
2. Create a project quickly, without losing quality
3. Create a project that many people within our agency can manage
4. Create a project that we can hand off to a different Webflow developer/agency if the client decides to change vendors
5. Create a project that a client can manage inside Designer\*

\* Not all clients want to manage their Webflow project. Some do, and most don't.

###### Creating a project that allows for scalability and flexible post-launch management significantly benefits any client company using Webflow.

Our decisions in Client-First help us build more efficiently as Webflow developers, as well as help deliver a top-value project to our clients.

#### Naming convention

Client-First has a focus on clear class naming throughout the project.

###### A Webflow developer, client, or any person should be able to understand what a class is doing based on a class name, even if that person has no experience with Client-First.

##### Goals of Client-First naming convention:

- Empower a non-technical person to manage our website.
- Be clear, informative, and descriptive in our class naming.
- Give the reader as much context into the purpose of the class.
- Read a class name and know what its purpose is.
- No abbreviations, no shorthand, no confusion.
- Give as much context into the relationship of that class with the website.
- Create names based on prefix and keyword organization techniques.
- Visualize the purpose of a class based on its name.

#### Overview topics

This Intro page reviews the essential topics of Client-First. These are not all of the principles of Client-First.

The goal of this page is to review the most important topics. Read this page if you are considering Client-First as your Webflow style system.

### Webflow focused strategies

- Classes strategy
- Core structure strategy
- Typography strategy
- Spacing strategy
- Folders strategy

‍

###### **Disclaimer:** This is not following every best practice of traditional HTML and CSS build conventions. This is not traditional, this is Webflow. Webflow has redefined how HTML and CSS can be managed visually in our projects. Client-First is built specifically for Webflow Designer workflow and organization.

### [fs-toc-h3]Classes strategy

We organize classes by "custom class" and "utility class". We define these two classes by the \_ character.

> Custom classes have \_ in the class name  
> *header-primary\_content*

> Utility classes don’t have \_ in the class name  
> *text-color-primary*

#### [fs-toc-omit]Custom class

**Usually for something specific and visual on the page**

> A custom class is created for a specific component, page, grouping of elements, or single element. For example, a class to style the team slider or a class to style the global headers for the project. **Custom classes use an underscore in the class name.**

Examples:

- ‍*about-team\_component*
- ‍*footer\_column*
- ‍*clients-slider\_arrow*
- *nav\_link*
- *home-header\_texture*

Form component example using *form\_[element-name]*

- ‍*form\_component*
- *form\_wrapper*
- *form\_block*
- *form\_label*
- *form\_input*
- *form\_submit*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659add8baed8807e177a1208_custom-class-intro.webp)

Each of these examples refers to a specific identifiable element.

#### [fs-toc-omit]Utility class

**Usually for an important CSS style on the page**

> A utility class is created for a specific combination of CSS properties, which can be applied to elements across the project. For example, a class for background-color or a class for font-size. **Utility classes will not use an underscore in the class name.**

Most of the classes that come with the Client-First starter project are utility classes.

Examples:

- ‍*padding-global*
- *max-width-small*
- *margin-large*
- ‍*text-color-secondary*
- *background-color-dark*
- ‍*display-none*

Each of these examples refers to specific CSS style properties.

#### [fs-toc-omit]Global class

**A custom class or utility class that can be used throughout the site**

> A global class is intended for use across the entire project. A global class is not for a specific instance. It applies styles that will remain 'global' or 'unified' across the project.

###### Global classes can be utility or custom classes.

A utility is always a global class. Utility classes are global in nature.

A global class can also be a custom class, such as *header\_content*. We may have a recurring header structure used throughout our project, and this class will allow us to manage the *header\_* styles globally.

If we intend to use the class throughout the website, it is considered global.

#### [fs-toc-omit]Combo class

> A class that is created as a variant to a base class. A combo class inherits styles from the base class and adds more styles on top of it.

We define the "base class" as the first class in our stacked combo class. We add a class on top of the base class to create a unique variation. The class that creates the unique variation has a class prefix of *is-*.

The stacked *is-* variant class will only work when **combined** with the base class(es) before it. Together, the stacked classes are a combo class.

In the video below, understand that *is-brand* does not work alone. It only works as an addition to the base *button* class.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/a03a7df088344d7e009507f226203cbf/manifest/video.m3u8)

Combo classes can be created out of custom or utility classes. The example above *button* *is-brand* shows a utility class as a part of a combo class.

###### We learn this concept in full on the [Classes strategy 1](https://finsweet.com/client-first/docs/classes-strategy-1) docs page.

### [fs-toc-h3]Core structure strategy

Client-First sets a default core structure to follow across all builds.

- *page-wrapper*
- *main-wrapper*
- *section\_[identifier]*
- *padding-global* *padding-section-[size]*‍
- *container-[size]*‍

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659add68d0b3c86a1e44d7ba_core-structure-intro.webp)

- *page-wrapper* wraps all page content.
- *main-wrapper* holds all of the page's "main" content. This is a best practice for web accessibility.
- *section\_[identifier]* organizes Webflow Designer's Navigator panel.
- *padding-global* manages universal site-wide left and right padding of a page's content.
- *padding-section-[size]* manages universal site-wide top and bottom padding of sections.
- *container-[size]* manages max-width on the containers that wrap our content.

Using this core structure, we can manage important page-level CSS properties for our project globally. This practice defines a unified approach across all Client-First developers.

Most websites would follow the structure shown below.

#### [fs-toc-omit]Page structure example

Sections are organized inside Navigator and work as anchor links when clicking through them.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/4c43af4ba96116ad4e28b3ee960a2184/manifest/video.m3u8)

#### [fs-toc-omit]Section structure example

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659adeaf1b3593da286d9f08_section-structure-intro%20.webp)

Inside the core structure, we create components and visual web elements with custom classes. We use custom classes to style elements that should not be managed with utility classes.

###### We learn this concept in full on the [Core structure strategy](https://finsweet.com/client-first/docs/core-structure-strategy) docs page.

### [fs-toc-h3]Typography strategy

Our strategy is to keep typography as unified and globally manageable as possible. We use utility classes to manage typography.

Ideally, we don’t place any class on a text element. It’s best to inherit the default styles applied directly to the body, paragraph, and H1 - H6 HTML tags.

#### [fs-toc-omit]HTML tags

[What are HTML tags?](https://university.webflow.com/lesson/html-tags) Webflow University resource.

Always start with styling these:

H1, H2, H3, H4, H5, H6 , body

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/d677bb4c02a6bc8a7aee2660d97c5e6a/manifest/video.m3u8)

‍

**These are the default styles** for each Heading and the Body of our project.

###### Classes are required only when there is customization from the default.

We have a collection of utility classes included with the official Client-First cloneable. Each of these classes has a *heading-* or *text-* prefix and holds utility styles to apply to text elements. These classes apply our customizations through a unified utility system.

#### [fs-toc-omit]Typography classes:

- *heading-style-[h#]*
- *text-weight-[weight]*
- *text-size-[size]*
- *text-style-[css-property]*
- *text-color-[identifier]*
- *text-align-[alignment]*

For example, if we want to make an H1 Heading the same style as our H2 Heading, we can add the *heading-style-h2* class on our H1. This will make the H1 styled like an H2, while maintaining the H1 tag for SEO.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/a0f49d04c3b52b3ff5dadeb64b4b880a/manifest/video.m3u8)

For example, if we want to make any text element in the project blue in color and you have a utility class like *text-color-brand* linked with the blue color, we can apply *text-color-brand* to that text element to make it blue.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/e8a4d1cd9a8dd825fd9eae98b49c468f/manifest/video.m3u8)

‍

Both of these examples are a customization of the default typography styles. If there is no customization past the default H1 or Text Element, there is no need for a class.

###### We learn this concept in full on the [Typography strategy](https://finsweet.com/client-first/docs/typography-strategy) docs page.

### [fs-toc-h3]Spacing strategy

Spacing is organized into two parts:

1. Utility classes
2. Custom classes

Each of these has two primary strategies to implement.

#### [fs-toc-h4]Utility classes

The *margin-* and *padding-* classes found in [Client-First utility classes](https://finsweet.com/client-first/docs/utility-class-systems).

###### ‍*[margin/padding direction class]* + *[margin/padding size class]*

Inside the utility class mindset, we present 2 spacing strategies:

1. Spacing block strategy
2. Spacing wrapper strategy

Both blocks and wrappers are based on the same utility spacing classes.

Blocks and wrappers are different from each other based on how they are applied to the page.

##### Spacing block strategy

> In Client-First, a "spacing block" is an empty Div Block that creates space between two sibling elements.

###### 1. Add a **Div Block** "spacing block" to the page with two classes — ‍*[padding-bottom]* + *[padding-size]* 2. Add content elements to the page as siblings of the spacing block. 3. The spacing block creates space (padding) between elements.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659adecfc4408c7cd75f1236_spacing-block-intro.webp)

##### Spacing wrapper strategy

> In Client-First, a "spacing wrapper" is a Div Block that wraps a child element and creates space between a sibling element.

###### 1. Add a **Div Block** "spacing wrapper" to the page with two classes — ‍*[margin/padding-direction]* + *[margin/padding-size]* 2. Nest a content element inside the spacing wrapper. 3. The spacing wrapper creates space (margin or padding) between itself and a sibling element.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659adf18589d4584c9c35e4f_spacing-wrapper-intro.png)

#### [fs-toc-h4]Custom class strategy

##### Custom class on element strategy

"Custom class on element" applies margin and padding values directly to the element that needs to be spaced.

For example, we apply *faq\_title* to a Heading that requires unique spacing, which the utility class system can not achieve. A CSS property of margin-bottom: 0.75rem is applied directly to the *faq\_title* class.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659adf3246ce1c0288398c0e_custom-on-element-intro.webp)

##### CSS Grid strategy

CSS Grid spacing strategy applies CSS Grid to a parent wrapper which creates space for the children inside it.

We can create vertical and horizontal space between child elements using CSS grid.

Instead of applying many blocks, wrappers, or custom classes on elements in a list, we can use CSS Grid strategy to manage all children with one controller — the parent wrapper.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659adf6fc6ff554eb6986cf9_css-grid-strategy-intro.webp)

###### We learn about Spacing strategy in full on the [Spacing strategy](https://finsweet.com/client-first/docs/spacing-strategy) docs page.

### [fs-toc-h3]Folders strategy

Client-First includes a virtual Folders feature through Finsweet Extension.

###### The underscore character is powerful in Client-First

The underscore indicates a custom class **and** a folder. We can create virtual folders for our custom classes using the underscore character.

For example, *blog\_header\_graphic* represents a *blog\_* folder with a nested *header\_* folder inside with a *graphic* element inside it.

It looks like this in the virtual folder system:

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659adfe886ab23620525f4c5_folder-strategy-intro.webp)

By excluding the underscore, we are creating a utility class. Utility classes are automatically organized inside the Utility folder.

###### Any class without an underscore will be placed inside the Utilities folder.

Each nested folder inside the Utility folder will be generated from the first keyword of the class name.

For example, *text-color-primary* represents the **Utility classes folder** with a nested *text-* folder with a nested *color-* folder with a *primary* identifier inside.

It looks like this in the virtual folder system:

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659ae0028861b35ea670807d_folder-strategy-2-intro.webp)

With the power of Folders, we can organize our project in any way. Small projects will follow a different folder strategy than large projects. Custom-built projects will follow a different folder strategy than component libraries.

Folders give us the power to customize the build strategy based on the project we are building.

###### We learn this concept in full on the [Folders strategy](https://finsweet.com/client-first/docs/folders-strategy) docs page.

### Sizes and rem

Client-First uses **rem**. Rem is a unit of measurement for the values we enter in Designer.

#### What is rem?

Rem stands for **"root ephemeral unit"** or **"root em"**.

- Rem is a relative measurement based on the root element's font-size.
- The root element is <html>.
- Rem is relative to the <html> font size.
- All sizes applied in Client-First are in rem

#### The math

Every 16px is 1rem when the browser's font size is set to the default in browser settings. When building our Webflow project, we use 16px as our base value for calculating rem.

Every rem measurement conversion in the project is a multiple of 16.

###### 96px / 16px = 6rem

###### 32px / 16px = 2rem

###### 4px / 16px  = 0.25rem

#### Why rem?

Rem has significant accessibility benefits, and we value accessibility deeply inside Client-First.

**Browser font settings** and **browser zoom** each work flawlessly inside a rem-based system. Using Client-First in our recommended rem system will assure we are following best practices with accessibility and content scaling.

###### We learn this concept in full on the [Sizes and rem](https://finsweet.com/client-first/docs/sizes-and-rem) docs page.

---

<!-- source: https://finsweet.com/client-first/docs/big-docs -->

GETTING STARTED

## Big docs

Client-First has a lot of documentation. This page explains why the docs are long and important.

### Why docs are important

We hear our community say, "Client-First docs are long." Let's address this comment clearly and understand why the docs are long.

We made the docs bigger and better with the v2 release of Client-First. Better organized with more explanations in smaller snippets. We are motivated to continue growing this documentation.

#### 1. Clear directions.

Documentation creates a formalized process for others to understand and follow. The process becomes more clear as we have more instructions for the process, We see "big docs" as a major benefit of Client-First as a system. Big docs will allow all of us to work collaboratively under one unified Client-First process. The docs are long because a formalized Webflow build system has many details. Improving the small details in Webflow separates the amateurs from the pros.

#### 2. Handbook for pros.

We can't be a pro at anything overnight. Being a pro in anything, including Client-First, comes with study and practice. Client-First is our official handbook to being a Finsweet Webflow developer. Our system was never intended for a quick 1 day of studying. To take advantage of Client-First, we must study the documentation and practice in Webflow. These docs are our attempt at lowering the learning curve to becoming a pro.

#### 3. Invest your time into a valuable skill.

We wouldn't ask you to read something unless we think it's important. We believe that learning Client-First will result in faster Webflow builds and more efficient project maintenance. We believe Client-First will bring valuable short-term and long-term benefits to your career as a Webflow professional.

‍

###### **New to Webflow?** Before learning Client-First, we recommend learning the basics of Webflow and web principles. Client-First does not teach HTML or CSS. It's important to have a beginner-level understanding of web topics before learning Client-First. Read our [Beginners in Client-First](https://finsweet.com/client-first/docs/beginners).

### Be patient

We will not be masters of Client-First on our first implementation. As we continue to use Client-First, study the documentation, and use the resources, we will become more effective with Client-First.

###### It's OK if you don't understand a docs page the first time you read it.

###### It's OK if you need to re-read a docs page multiple times.

###### It's OK if you take months to understand these topics fully.

Be patient, continue working hard, and your hard work will pay off.

---

<!-- source: https://finsweet.com/client-first/docs/classes-strategy-1 -->

CONCEPTS

## Classes strategy 1

Strategy for how we identify, use, and manage classes inside Webflow as a platform.

### Types of classes

#### Utility class

> A class created with a specific combination of CSS properties that can be applied to elements globally across the project.

All utility classes are global classes by nature. The concept of a utility class is a class that helps apply global CSS properties inside the project.

For example, we added utility class *background-color-primary* in the Client-First starter project to help us organize and manage commonly used background colors throughout the project.

We added utility class *font-size-large* in the Client-First starter project to help us organize and manage unified typography sizing throughout the project.

**Utility classes will not use an underscore in the class name.**

#### Custom class

> A custom class created for a specific component, page, grouping of elements, or single element.

We call this a "custom" class because it is custom outside of our project’s utility classes. Custom classes should be created when utility classes can not, or should not, be used on an element. The class is custom to that element.

For example, a class to style a specific element in the global headers for the project, *header\_background-layer*.

For example, a class to style a specific element in the testimonial slide, *testimonial-slider\_headshot*.

**In Client-First, custom classes use an underscore in the class name.**

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659ae844a5a2f97fb6983b91_custom-classclass-strategy-1.webp)

#### Global class

> A classification of a class. A global class is intended for use across the entire project. Both utility classes and custom classes can be global classes.

A global class applies styles that will remain unified across the project. A global class is not for a specific instance.

"Global" means everywhere and anywhere in the project.

All utility classes are global classes. Utility classes are global in nature.

For example, our margin and padding classes are global utility classes. *margin-large* has a margin value of 3rem. When we update that value to 4rem, every instance that uses *margin-large* will update to 4rem.

*margin-large* is a global controller that changes the value of our margin and padding across the project. We can make impactful, global changes to our project when we use global utility classes correctly.

Global classes are not limited to utility classes. Global classes are now more clearly defined as **any type of class** that intends to have full-site global management of styles.

In Client-First v2, we better explain and encourage the use of custom classes as global classes.

For example, *faq\_item* can be a global custom class. We have many FAQ sections throughout the website, and *faq\_item* is used to manage the FAQ items across the entire project.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659ae867fe2bbc52efd968ea_global-class-1class-strategy-1.webp)

For example, *header\_content* can be a global custom class. We have a header component on each page of the project. This class manages this content wrapper customization globally across the entire project.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659ae87b8ea73e0edfc59aed_global-class-2class-strategy-1.webp)

#### Combo class

> A combo class is a variant to a base class. A combo class inherits styles from the base class and adds more styles on top of it.

We define the "base class" as the first class in our list of stacked combo classes in a combo class. We add a class on top of the base class to create a unique variation.

The added class that gives the unique variation uses the class prefix of *is-*.

The stacked combo class will only work when combined with the base class(es) before it. In the video below, understand that *is-brand* does not work alone. It only works as an addition to the base *button* class.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/a03a7df088344d7e009507f226203cbf/manifest/video.m3u8)

Combo classes can be created from a custom or utility base class. The example above *button* *is-brand* shows a utility class as a combo class.  
‍

We can also create a combo class for a custom class. For example, *section\_header* *is-home*. This is a variant of the *section\_header* custom class.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659aee881b3593da2875c879_combo-classclass-strategy-1.webp)

##### -is prefix

We define a combo class in Client-First withthe ***is-*** prefix. When we see *is-* we know this class is created as a combo class on top of a base class.

### Don't deep stack classes

Client-First has a universal rule — don't deep stack.

> **Deep stack** — many classes 'stacked' on top of an element.

> **Deep stacking** — the action of stacking many classes on top of an element.

This is a term created by Client-First to address the problems we face with stacked classes in Webflow Designer.

Client-First does not recommend the deep stacking strategy in Webflow.

For example:

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659aeeb7cbd8d0f442fc5874_deep-stackclass-strategy-1.webp)

In Client-First, we want to avoid deep stacking classes like this. We will read about avoiding deep stacking throughout the docs.

Here is a quick list of reasons:

#### Reasons we don't deep stack.

##### Inability to reorder styles in Designer styles panel.

We don't have free control over stacked classes in Webflow. We are unable to reorder them or properly manage them inside Designer. If we need to change or remove classes in the stacked list, we have to remove all classes from the list before accessing earlier classes.  
  
In the case below, you can see that we have to remove some classes if we want to change the text weight from *text-weight-medium* to *text-weight-bold*:

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/e87d0a940bdc79a5443c262ef31491bc/manifest/video.m3u8)

This problem becomes extreme when making edits at lower breakpoint levels. We have even less editing control as we edit breakpoints outside the base breakpoints.

##### Slower workflow. Requires many steps for small changes

The workflow above is time-consuming. If this is a constant practice in our workflow, it will make our build and maintenance time longer.

##### Increased learning curve.

We believe that deep stacking leads to a steeper learning curve. There is a deeper requirement for understanding what the classes do and how to manage them.

##### Writing CSS in Webflow is fast

Writing CSS is fast and efficient through the Webflow Styles panel. We can create a new class and visually add CSS properties to the class. This process is very fast in Webflow, and we take advantage of it in Client-First.

##### CSS size saving is not too significant

When we use global classes in a project, we can reduce the size of our CSS file. We do not believe these small CSS savings outweigh the benefits of custom class creation inside Webflow.

###### **Learn more about deep stacking later:** There is a full explanation of each of these points in [Classes strategy 2](https://finsweet.com/client-first/docs/classes-strategy-2).

### Use custom classes

Custom classes are a powerful and recommended method inside Client-First.

We use custom classes for these purposes

1. Easy edits for specific elements. If we use an organized custom class system, we can make rapid unique changes to specific elements and components in our project.
2. To avoid the use of utility classes **everywhere** in our project. Utility class systems are powerful but should not be used to build the entire project. When using a utility class makes our job as Webflow developers more complicated, we encourage the creation of a custom class. There should be a clear benefit to using a utility class.
3. To avoid deep stacking. Deep stacking can be replaced with a custom class.

#### Background texture example

For example, we want to style the background texture on a component.

We may be able to style our background texture with three stacked classes. For example, *background-absolute* + *fit-size* + *opacity-low*. When combined, these three classes give us the style combination we need.

Instead of stacking multiple classes for this background texture, we can create a custom class called *services-item\_background-texture*. The class clearly states that this class is for "a texture that’s on a background image of a services item."

We can now quickly and more freely make edits to this custom class instead of re-organizing the stacked classes. If we need a unique styling, we have a custom class ready to accept that unique styling.

#### Traditional CSS development

In traditional CSS development, a stacked class solution may be the better solution. Stacked classes will require less CSS to write by hand, which will lead to faster development.

However, this is not traditional CSS development. This is Webflow. Client-First is a collection of principles created specifically for Webflow.

###### In Webflow, we believe it takes less time and effort to create and manage styles of a custom class on an element than managing a deep stacked class list.

There is a full explanation of custom class creation in [Classes strategy 2](https://finsweet.com/client-first/docs/classes-strategy-2).

### Naming convention

Create clear and specific names for classes.

A Webflow developer, client, or anyone should understand what the class is doing based on the class name, even if they've never heard of Client-First before.

#### Naming mindset

##### Goals of Client-First naming convention

- Empower a non-technical person to manage our website.
- Be clear, informative, and descriptive in our class naming.
- Give the reader as much context into the purpose of that class.
- Read a class name and know what its purpose is.
- No abbreviations, no shorthand, no confusion.
- Give as much context into the relationship of that class with the website.
- Create names based on organization techniques.
- Use keywords to search for available classes inside the Styles panel.
- Visualize what a class' purpose is based on its name.

##### Questions to ask ourselves when naming classes

Class names should say what they do. When creating a name for a class, we can think of these questions:

- **"What is this class doing in the project?"**
- **"What is the purpose of this class in the project?"**
- **"How can I give the most context into what this class is responsible for in the project?"**

The name of a class should answer these questions.

A Webflow developer, client, or marketer should be able to understand what the class is doing based on a class name, even if they're never heard of Client-First before.

#### Meaningful names and keywords

A strong keyword gives us context into what this class/element is doing. Being as descriptive as possible in our naming will help us stay organized.

Keywords and clear naming are deep core concepts of Client-First. Each class name should serve a meaningful purpose. We should give the next person who enters the project as much context into the purpose of the class.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659aeecf3f6e35df56cc4f28_meaningful-namesclass-strategy-1.webp)

#### Keywords go from general to specific within a class name

Let's look at *text-size-large* as an example.

The most general keyword in this class name is *text*. This word tells us that this class has to do with a text element.

*size* tells us we are working with customizing the size of the text. The word "size" is more specific as it relates to a particular CSS property of the text — font-size.

Last we have *large*, which gives us more specific information about the value of the text size. It's a large text size.

Notice how we are **not** calling this class *large-size-text*. Although this may be equally as clear as *text-size-large*, we have significant benefits in Client-First when we follow a general-to-specific class naming convention. We enable more intelligent class search and clean Folders organization. We will learn more about this throughout the docs.

Let's look at an example using a custom class, *team-list\_headshot-wrapper*.

The folder name is *team-list\_*, which tells us this element has something to do with the team page or a team section and is a list. "Team list" is the name of the group containing the specific elements.

*headshot* is getting more specific and telling us that this has something to do with the headshot element within the team list.

*wrapper* is getting even more specific and telling us this is wrapping the headshot.

Reading the class name *team-list\_headshot-wrapper* is clear and logical, even if the user doesn't understand the CSS behind it. The user would understand that editing this class will do [something] to the team list headshots. That's an excellent hint for the next person who enters the project.

Now imagine adding more elements inside our headshot wrapper. We can stay very organized with a general-to-specific naming convention.

*team-list\_headshot-wrapper*  
*team-list\_headshot-image*  
*team-list\_headshot-texture-layer*  
*team-list\_headshot-background*

Our list of classes for the team list is very organized and logical inside our project. This naming convention integrates very well into our Folders feature.

---

<!-- source: https://finsweet.com/client-first/docs/core-structure-strategy -->

CONCEPTS

## Core Structure strategy

Establish a unified, well-defined, and flexible structure that we can use for all pages across Client-First websites.

### What is Core Structure?

> Client-First core structure is a set of classes and principles to create a strong base of HTML around our page content.

Small sites, big sites, beginner sites, and advanced sites can use this same structure.

Client-First users will know a Client-First website's core structure immediately. For people who don't know Client-First, our human-readable class names will help them understand what each layer of the structure is doing.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659af3788861b35ea67ada66_core-structure-core-structure.png)

We can think of our core structure as "layers" of Div Blocks surrounding our page content. Each layer has a specific use to help us build a web page.

### Explanation of each Core Structure class

A total of 6 different classes make up our Core Structure.

#### *page-wrapper*

Outermost parent of all elements on the page. This Div Block wraps every element on the page.

**Styles:**

Styles for *page-wrapper* are optional. Styles can be applied if needed. However, this element should not be heavily styled.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659af391b26d4e6c1de5ac26_page-wrapper-core-structure.png)

‍**Primary use cases:**

- Quick 'copy to clipboard' option for all elements on the page. We can then 'paste' the entire page to a different page.
- We have a site-wide global class available if we need to apply a style to the entire page. For example, applying overflow: hidden to the entire page to prevent horizontal scroll. **Caution:** While applying overflow: hidden stops all horizontal page scrolling issues, it also prevents CSS sticky from working on all nested elements.
- To prevent applying classes and unique styles directly on the **<body>** HTML tag. In Client-First, we limit **body** tag styles to typography and background-color properties. We can apply custom styles to the *page-wrapper* that wraps the entire page. This will keep our **body** styles limited to typography and background-color.

‍

#### *main-wrapper*

The **main** content of the page. Use a **<main>** HTML tag that wraps all or most of our website content sections.

The nav and footer should not be inside this <main> tag.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659af3aadc806fe15bb167c5_main-wrapper-core-structure.png)

**Styles:**

Styles for *main-wrapper* are optional. Styles can be applied if needed.

‍**Primary use case:**

- Accessibility best practice. This layer of our core structure is here to help screen readers and search engines understand where our page's "main" content is.

‍

#### *section\_[section-identifier]*

The primary use case of the section class is to give us a better workflow inside Webflow Designer. This element organizes our Navigator view and helps us quickly navigate inside the Designer canvas.

This Div Block wraps an entire section of content. It is recommended to set the HTML tag of this element to **<section>**. We do this on the Settings panel of *section\_[section-identifier]* element.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659af3c2ccb0bcb6945f8df3_section-identifier-core-structure.png)

Understand that this section layer will be in a different folder than the contents inside of it. Based on the naming convention of *section\_[section-identifier]*, all section classes are inside the *section\_* folder.**‍**

**Styles:**

If possible, we should avoid applying styles to *section\_[section-identifier]*. However, we can apply styles to it if we want.

**Control global styles of sections:**

Apply a global add-on class like *section-style-dark* to the *section\_[section-identifier]* class to maintain global CSS properties across all sections. Each *section\_* class is a custom class. We do not want to continue applying the same CSS properties to each. If we need a "dark section", for example, we can apply our color: white and background-color: black classes to *section-style-dark*, and this class can act as a global add-on to our custom *section\_* class.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659af3df46ce1c028844ad57_section-custom-core-structure.png)

**Primary use cases:**

- Identify a section on a page from the Navigator panel. The goal is to create a type of sitemap for our page. This is a Webflow Designer UX decision.
- Anchor scrolling effect inside the Navigator panel. As we click on each section wrapper, the page will anchor scroll the section.
- We find it more difficult to onboard our clients to their Webflow without a visual or 'sitemap' of the page. This section naming gives our clients a clear view of the page's content.
- The anchor scrolling in Navigator improves our workflow as developers and helps us work faster.

**Example:**‍

A homepage may have sections like header, about, how it works, testimonials, and contact. We can name our sections with descriptive titles to understand what's on the page.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659af570dc806fe15bb23ce5_section-2-core-structure.png)

‍

#### *padding-global*

Global horizontal spacing. This class manages the left and right padding of a page's content.

We do not want to use this class to add space to content items. For example, we do not want to use this class to style the padding of a content item in a list.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659af598c3077f1f75dfbb31_padding-global-2-core-structure.png)

‍**‍**

**Styles:**

padding-left and padding-right are the only CSS properties styles on the *padding-global* class. We do not want to add other CSS style properties to this class.

**Primary use cases:**‍

- Unified site-wide padding-left and padding-right
- Global controller to manage the entire website's universal left and right padding.**‍**

**Default implementation:**‍

There is flexibility in how we can use *padding-global*. Our recommended structure for *padding-global* is this:

- *main-wrapper*
- *section\_[section-identifier]*
- *padding-global*
- *container-large*

...(e.g. components, elements, etc.)

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659af63b5243ed5b2c7eaf29_padding-section-2-core-structure.png)

**Flexibility:**

There is flexibility in where we can place *padding-global*.

We separate *padding-global* styles from other core structure styles so it can be used with or without other essential page structures. This is the power of layers.

Separating padding will allow us to add *padding-global*

- As a parent of *container-large*‍
- As a child of *container-large*‍
- Or both together

Each can result in a different end layout visual.

If we add padding CSS values to our *container-large* class, we are always locked into page padding styles when using a container. We may not always want this. By decoupling padding from max-width, we can use them independently.

#### *container-[size]*

A unified global container system for content on the page. All, or most, page content can go inside the *container-* class.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659cbc15089b5b2811c7ab15_container-size-core-structure.webp)

**Styles:**

- margin-left and margin-right set to auto for centering the Div Block on the page.
- width: 100% to ensure we always take up 100% of the available space.

- max-width value to contain the content within a certain width. Client-First includes three different container sizes — small, medium, and large. We can edit these values, add new values, or remove values.**‍**

**Primary use cases:**

- ‍**‍**To center content on the page
- To set and maintain unified max-width values across the project.

Depending on our build, we can set 2, 3, or 4 different container classes.

Client-First comes with three different container sizes of max-width — small, medium, and large. We can edit these values, add new values, or remove the values based on our project.

‍

#### *padding-section-[size]*

A unified global vertical spacing system for sections. Create top and bottom padding inside a section.

This core structure class should be used on the div block with *padding-global* class to reduce nesting elements as example below:

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659af6559709519812aeb8c2_padding-section-core-structure.png)

**Styles:**

- padding-top and padding-bottom to create vertical spacing for a section.**‍**

**Primary use cases:**

- ‍**‍**To maintain unity across the spacing of sections in the project.
- Update all top and bottom paddings across all sections globally across the project.

We can set 2, 3, or 4 different section sizes in our project.

Client-First comes with three different sizes of section padding — small, medium, and large. We can edit these values, add new values, or remove the values based on our project.

If we have a unique section padding, we can apply unique styles to the section's *section\_[section-identifier]* class.

---

<!-- source: https://finsweet.com/client-first/docs/sizes-and-rem -->

GETTING STARTED

## Sizes and rem

Explanation of rem units and approved rem values in Client-First.

### Rem

Webflow defaults to **px** units. If we type "**10**" into any Designer input and press "Enter", it will set "**10px**".

Client-First uses **rem**, which we can select in the unit dropdown.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659af7a026c74fabe4172e4e_introsize-and-rem.webp)

#### What is rem?

Rem stands for "root em".

- Rem is a relative unit of measurement based on the root element's font-size.
- The root element is html.
- Rem is relative to the html font size.
- Most sizes applied in Client-First are in **rem**.

#### Inheriting browser font size

In Client-First we inherit the html font-size from the browser.

Browsers initially use **16px** as their default html font-size.

**1rem** = **16px** conversion is the browser default.

Based on Client-First approved sizes, we can make quick **px** conversions to **rem**. For example, Client-First approved **rem** values are **0.5**, **1**, **1.5**, **2**, **2.5**, **3**, and so on.

**Rem** and Client-First are a powerful couple for following best accessibility practices with browser font size.

#### The math

Every **16px** is **1rem** when the browser's font-size is set to "default" in browser settings.

When we build our Webflow project, we always use **16px** as our base value for calculating **rem**.

> Every rem measurement conversion is a multiple of **16**.

To convert **px** value into **rem** divide this value by **16**.

###### **64px** / **16px** = **4rem**

To convert **rem** value into **px** multiply this value by **16**.

###### **2rem** x **16px** = **32px**

For convenience, we suggest using easily readable **rem** values like **1**, **2**, **2.5**, **3**, **4**, **5**.

We want to avoid consistent usage of long number values like **8.4375rem**. These values are more difficult to remember and will slow us down in our workflow.

##### Calculations in Webflow Designer

Inside most unit inputs of Webflow Designer, we can calculate **rem** natively in Webflow.

Inside the width input of Designer, type "**100/16rem**", press "Enter", and see the **rem** value calculated.

We can divide any number by **16** to get its **rem** value inside Webflow Designer.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/de43cfc1dced4e98e7e8f73a97d93791/manifest/video.m3u8)

#### Accessibility benefits

##### Browser font size settings

Browsers use **16px** as their default html font size — and browsers allow the user to update the default font size. Users can update their preferences and change the font size settings.

Browser font size settings are an essential accessibility topic. When users update their browser font, the website content should adjust with the change. Client-First rem system adapts to the user's browser font size settings.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/476b9f437a827252e6b5b81c48f2012b/manifest/video.m3u8)

‍

When we work in other unit measurements, like **px** and **vw**, we ignore the user's preferences to update their browser font size settings.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/aa3187a2355e93fd08e5e3033151b573/manifest/video.m3u8)

##### Browser zoom

**Rem** also respects a user's browser zoom controls. When a user zooms in or out on the page, our layout and content in **rem** will zoom together with the user.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/541399cd7e48c07a9279cd611bd17e68/manifest/video.m3u8)

When we use **vw** or **vh** units, browser zoom will not work.

‍**vw** relies on browser viewport width (or height in the case of **vh**). Only a change in the browser window will affect sizes set in those units.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/33a4a34610278bfa707f49516e79750d/manifest/video.m3u8)

###### Client-First follows best accessibility practices. The decision to work in **rem** is directly related to this accessibility and UX benefit.

Learn more about accessibility using **rem** in our [Wizardry vs. Client-First comparison](https://finsweet.com/client-first/wizardry-comparison) article. This is a technical overview of the benefits of **rem** as an accessible measurement unit.

#### Recommended px to rem values

Below is a list of all recommended **rem** values with their converted **px** measurement.

These Client-First approved values are a recommendation and not a strict requirement.

This list of sizes is interactive. Update values through the sticky navigation menu.

Thank you! Your submission has been received!

Oops! Something went wrong while submitting the form.

[Reset](#)

HTML font size

Thank you! Your submission has been received!

Oops! Something went wrong while submitting the form.

px values

rem values

2px

=

0.125rem

##### Closest to Client-First values

2px

=

0.125rem

##### Neighboring values

2px

=

0.125rem

Client-First suggests working with these values.

There are 3 exceptions to using the above values.**‍**

##### 1. Typography

Using **14px** for font-size is common and recommended when **16px** is too large. **12px** font-size is often too small for typography.**‍**

###### **14px** = **0.875rem**

##### 2. 2px spacing

Use **2px** for tiny spacing. If a spacing value less than **4px** is needed, use **2px**.**‍**

###### **2px** = **0.125rem**

##### 3. 1px is 1px

When using **1px**, for example as a CSS border, use **1px** as the value.

We do not recommend converting **1px** values to **rem**.

Retina devices have different scaling rules than non-retina devices. Using **1px** will create exactly **1px** line on any device without retina scaling interference.**‍**

###### **1px** = **1px**

#### Finsweet Extension px to rem migration tool

[Finsweet Extension](https://www.finsweet.com/extension) offers a tool to convert projects created in **px** to **rem**.

It will convert every value in the project from **px** to its computed **rem** value.

Inside the Client-First tab of Finsweet Extension, the "**PX to REM Migrator**" candy will manage the size unit migration.

---

<!-- source: https://finsweet.com/client-first/docs/typography-strategy -->

CONCEPTS

## Typography strategy

Build and maintain a unified typography style system across the project.

### HTML tags are default

Typography should be our project's most simple and organized type of utility system. Websites with unified typography systems help us to be clear to the user.

We can think of HTML typography tags as our default typography values.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659afbe1094eaac10e682342_html-1-typo-strategy.webp)

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659afbef3720048fb2f16b3b_html-2-typo-strategy.webp)

In a perfect world, we would never have to put a class on a Heading or Text Element. Following the default typography in all instances would result in a clean and organized project.

However, it’s common for brand designs to have variations and customizations for different instances of text.

We use a class when there is a variation from the default typography style. A class changes the default typography value.

For example, a global utility class such as *text-size-medium*.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/4e48a4cb8d73c754e393687fbd102e9f/manifest/video.m3u8)

We apply *text-size-medium* to the Text Element because the size is a variation from the default body font-size.

### Utility classes to customize the default

We use global utility typography styles to help unify, organize, and manage these typography variations.

Client-First comes with a global utility class system to get us started with typography organization. We use *text-* and *heading-* as prefixes for our typography utility classes.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659afc1cb8aeee694ea263e9_workflow-typo-strategy.webp)

#### Benefits of Client-First typography system

##### 1. Global management

Globally manage the important CSS properties that make up the typography variations. We can make global site-wide typography changes by changing one single value.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/02801efe84130d7fe31edde35bbf7309/manifest/video.m3u8)

##### 2. Prevents unnecessary class creation

Prevent duplicate class creation for reused styles. Global utility classes will reduce the number of unique custom typography classes created. For example, *text-color-brand*.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/1faa82cc3a0e03e9945292dc278493a4/manifest/video.m3u8)

We want to avoid creating multiple custom classes that manage our text's color: blue.

##### 3. Workflow, speed, and organization

We can search for and manage our typography classes in the Designer Styles panel by typing the prefix *text-* or *heading-*. This allows us to use typography classes in our workflow quickly.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659afc1cb8aeee694ea263e9_workflow-typo-strategy.webp)

This prefix naming convention helps us manage our typography inside the Styles panel search and Folders. We can organize our typography utility classes in a dedicated folder structure.

Typography organization enables us to work faster and more efficiently inside Designer.

### Reasons to customize the default typography

#### Variation in style

The most common reason.

When there is a style variation to the default typography element, we may want to apply a global utility class.

We can use one or more global utility classes to customize the text instance. For example, *text-color-primary*, *text-weight-semibold*.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/183ad0d23459580605497779839598d4/manifest/video.m3u8)

By adding different class combinations to the typography element, we have many options to style our text.

###### Most of our Headings should be without a class when possible. The more we use the default styles, the more unified our typography is.

#### Heading tag for SEO does not match Heading tag in design

For example, we need to use an H1 tag for the page's title. The H1 is required for SEO and page crawling. However, the styles of this title should follow the H2 styles of the project.

We have a conflict where the SEO-required Heading tag needs the default styles from a different Heading tag.

We can apply *heading-style-h2* to the H1 element to mimic the H2 style while maintaining the H1 tag for SEO.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/591afef7f1a43125c709dc2397642493/manifest/video.m3u8)

*heading-style-h#* classes are helpful for implementing any Heading style while keeping the SEO-appropriate Heading tag for the text element.

It's crucial to understand that *heading-style-h#* does not change the HTML Heading tag of the element. It only changes the CSS styles applied to the element.

###### Applying the *heading-style-h#* class should not be used for most instances. Most of our Headings should be without a class and follow the default. Our default Heading styles should be more common than Heading variations.

#### Avoid using a Heading tag

We only want to use Heading tags for Headings. If there is text on the page that is not a Heading, but needs Heading styles, do not force a Heading tag on the element.

We want to keep our H1 - H6 organized and used correctly for SEO.

In this example, the monthly pricing is featured. We do not want to use the Heading tag for this use case because it is not a Heading with relevant content. However, we need the styles from H2.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659afc3e46ce1c028848f095_avoid--heading-tag-typo-strategy.webp)

Instead of using a Heading tag for non-Heading elements, we can use a Text Element and a custom class to style it.

### Customizing the typography system

The official Client-First starter project gives us a good starting point. It is not your final set of typography styles for the project.

With each new project, we should update the style guide page based on the styles of the project.

#### Create a new utility class system

After we update all of the typography classes that come with Client-First, we should consider adding new typography classes to the project.

We can create new typography systems inside the utility class model.

For example, if we are building a site with different values of opacity throughout the project. We can create a utility folder for typography opacity.

*text-opacity-low*  
*text-opacity-medium*  
*text-opacity-high*  
*text-opacity-full*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659afc56e7ee5155504bcf65_new-utility-class-typo-strategy.webp)

Creating these classes would be represented like this inside Folders:

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659afc686a43dcf0de1ef53f_utility-folder-typo-strategy.webp)

We can create new folders inside the Utility Classes folder for any CSS property we want to manage globally.

#### Create a new utility class to avoid deep stacking

In Client-First we always want to avoid deep stacking classes. We can deep stack global utility classes to get the exact text customization we need.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659afc7a524adf76bff6ea0f_avoid-deep-stacking-typo-strategy.webp)

There is a complete explanation of deep stacking in [Classes strategy 2](https://finsweet.com/client-first/docs/classes-strategy-2).

When deep stacking typography classes, we will have difficulty changing earlier classes in the list of stacked classes.

If this combination of stacked classes is recurring in our project, we can consider creating a new utility class that represents the stacked class group.

For example, we can take our example above and combine all styles to *text-style-subtitle* — or *text-style-alternative* — or any other name to describe the use of the combined styles.

We can use this class each time this deep stacking use case occurs.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659afc9208197e3dee6c11d9_alternative-typo-strategy.webp)

The folder name inside the text folder is our decision.

We can use the 'style' folder to hold these grouped styles — *text-style-alternative*.

We can also create a new folder —*text-custom-alternative*.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659afcb06a43dcf0de1f0f7c_alternative-folder-typo-strategy.webp)

Understand that the more we use this strategy, the less global our typography system becomes. We will have to take additional steps to change key global style properties.

For example, if the properties of *text-size-large* was used to create *text-style-subtitle*, and we want to update all *text-size-large* from 3rem to 4rem, we would need to make this change twice — Once to *text-size-large* and once to *text-style-alternative*.

We no longer inherit *text-size-large* when we grouped our stacked classes to create *text-style-alternative*.

We lose a lean global typography system if we abuse this grouped styles strategy. However, when used intelligently, it can help us work faster. Always make meaningful decisions when creating new utility classes of grouped styles strategy.

### Create a custom class

The utility class system will not work for every use case.

Reasons a custom class may be better for text:

- Unique and specific text
- Manage a particular grouping of text
- Customize responsive default

###### "Create a custom class" should not be a common practice for the project. Ideally, most of our classes fall into the utility typography system.

However, sometimes a custom class is best. Below we identify three use cases where a custom class may be ideal.

#### Unique and specific text

When we have unique text that does not fall into our utility system, we can create a custom class to apply the exact styles required for the text.

For example, *footer\_copyright-text*. The copyright text is very small, has a special grey color, is all-caps, and has different stylings across breakpoints. It's a specific identifiable text element with a unique combination of styles.

Creating this combination of styles may be possible to style with utility classes with 4-5 stacked classes. We never want to force a text element into the utility class system.

It's quick and easy to use a custom class for this specific instance.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659afcc6572e2947eeefbc37_unique-specifc-typo-strategy.webp)

#### Manage a particular grouping of text

With one style change, we can update all instances of the special grouping of text.

**Footer link Example**

For example, *footer\_link*. The footer link is seen [8] times in the footer of the project. Applying this one class to each of the footer links allows us to manage the group of text together.

Adjusting the size of the *footer\_link* text can be made to one item, and all *footer\_link* items will change with it.

The ability to update all instances is beneficial for text with a high likelihood of responsive customizations.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/f214f8d5d3919511d307fc234cbc8e90/manifest/video.m3u8)

#### Customize responsive default

Our utility typography system is ideal for maintaining default typography **across all breakpoints**.

If text does not follow the default across all breakpoints, a custom class may help us achieve this customization.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/d17d771b6ce916f48eb00c486ccbc411/manifest/video.m3u8)

For example, the H1 on the page follows normal H1 styles on desktop and tablet. On mobile, the H1 text reduces size significantly. The H1 is a long string of text and the size must be adjusted for mobile. We can use a custom class to achieve this customization on lower breakpoints. For example, *faq-template\_heading-text*.

---

<!-- source: https://finsweet.com/client-first/docs/spacing-strategy -->

! Updated with the new Spacer system

CONCEPTS

## Spacing strategy

Make intelligent spacing decisions inside Client-First. This documentation page explains strategies for applying spacing throughout our project.

### Intro

#### Spacing strategy

This page explains how to implement all spacing methods recommended by Client-First.

###### Client-First spacing strategy should bring more consistency to our project. We want to create less chaos and confusion. Our workflow and project quality improves if we use Client-First spacing strategies intelligently.

We organize this docs page into two parts:

1. Part 1: Utility classes
2. Part 2: Custom classes

### Part 1: Utility classes

Part 1 of Client-First spacing is about global utility classes. We include several strategies for using utility classes inside the project.

Different projects, use cases, and implementations may favor one strategy over another. Having multiple spacing strategies with utility classes gives us flexibility when building our projects.

Client-First utility class spacing gives us options for implementation:

1. Spacing block strategy: Option 1 (*spacer-* classes) or Option 2 (*padding-* classes)
2. Spacing wrapper strategy (*margin-* / *padding-* classes)

These utility class systems are included with the [Client-First utility classes](https://finsweet.com/client-first/docs/utility-class-systems).

#### Spacing block strategy

**Option 1:**

###### ‍*spacer-[size]*

**Option 2:**

###### ‍*padding-bottom* + *padding-[size]*

> In Client-First, a "spacing block" is an empty Div Block with utility class(es) that creates space between two sibling elements.

###### 1. Add a **Div Block** to the page with the class— ‍*spacer-[size]* 2. Add content elements to the page as siblings of the spacing block. 3. The spacing block creates space (padding) between elements.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b58bbe94344098dbea473_spacer-spacing-strategy.png)

Spacing blocks can be used to create space between any elements vertically.

##### **Option 1 or 2?**

The *spacer-*  system is similar to the *padding-bottom* + *padding-[size]* system, and they both achieve the same outcome.

Client-First gives you the option to choose which implementation method works best for your workflow.

The primary difference is that *spacer-* classes use one class, while the *padding-* based classes use two classes.

With the two class implementation, we apply *padding-bottom* class (direction) and then add our *padding-medium* class (size) in addition to it. Together, the two classes apply padding-bottom: 2rem to the element.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659adecfc4408c7cd75f1236_spacing-block-intro.webp)

The decision to use one or the other is up to you as the developer.

One benefit of the *spacer-* class system is the option to add responsive variants. This is explained [later in the page.](#responsive-spacing)

#### Spacing wrapper strategy

###### ‍*padding-[direction]* + *padding-[size]*

and

###### ‍*margin-[direction]* + *margin-[size]*

> In Client-First, a "spacing wrapper" is a Div Block that wraps a child element and creates space between a sibling element.

###### 1. Add a **Div Block** "spacing wrapper" to the page with two classes — ‍*margin/padding-[direction]* + *margin/padding-[size]* 2. Nest a content element inside the spacing wrapper. 3. The spacing wrapper creates space (margin or padding) between itself and a sibling element.

We add a Div Block to the page and apply *margin-bottom* class (direction) and then add our *margin-medium* class (size) in addition to it. Together, the two classes apply margin-bottom: 2rem to the element.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b58d646ce1c02887b68be_margin-bottom-spacing-strategy.webp)

We nest an element inside the spacing wrapper to create space between the nested element and something else.

#### Use cases for: Utility spacing in general

##### 1. Use default global spacing values

###### **Benefit:** We keep our spacing values more consistent and unified throughout the project

We want to unify our website's spacing across sections and pages. If we're using 4rem, 8rem, 12rem as our primary spacing values across the project, we want those values to be consistent everywhere.

The more we use the Client-First utility spacing system, the more consistent our spacing will be throughout the project.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/8903173a19873eca8323a2b9fa18db52/manifest/video.m3u8)

###### **Benefit:** We have default and automatic spacing updates across tablet and mobile breakpoints.

A spacing block or spacing wrapper automatically implements unified site-wide spacing adjustments across all breakpoints.

If we apply spacing blocks and wrappers to 100 elements across the project, that's 100 fewer tablet and mobile styles we have to apply in our project.

‍**For each breakpoint level**, elements spaced with blocks and wrappers will receive the default spacing values used across the project.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/8903173a19873eca8323a2b9fa18db52/manifest/video.m3u8)

###### **Benefit:** We can make global site-wide spacing updates throughout the project.

We can update many spacing values across the project with one CSS property value change. The update influences every element that uses a utility spacing class. For example, if a client says, "I want less spacing between all of the content", this update can be made relatively quickly by adjusting the global utility spacing values.

‍

##### 2. Workflow and scalability benefits

###### **Benefit:** If we are using a utility class strategy, we can reduce the number of custom classes used for margin and padding CSS properties

We want to reduce the number of custom classes created specifically for spacing. Spacing blocks and wrappers can help us create fewer classes for our project.

We can rely on the utility classes already created for the spacing. As we use the utility spacing system more, we will rely less on creating custom classes for spacing.

###### **Benefit:** We avoid deep stacking classes on top of an element.

Client-First is against deep stacking inside Webflow projects. We want to avoid deep stacking at all times. Spacing wrappers and blocks help us avoid deep stacking classes on our elements. Learn more about deep stacking in [Classes strategy 2](https://finsweet.com/client-first/docs/classes-strategy-2).

###### **Benefit:** If used correctly, spacing wrappers can help us work faster.

Spacing blocks and wrappers in Client-First exist to **help us work faster** and **maintain our project better**.

If we use wrappers and blocks, and this results in a slower workflow or project management difficulty, we may be misusing spacing wrappers.

###### It's not required or recommended to use utility spacing everywhere.

Applying margin and padding CSS properties directly to custom classes is acceptable. There are use cases where it’s more efficient to apply spacing on a custom class. We discuss custom class use in the second part of this article.

‍

##### 3. Spacing of typography and buttons

In this example, we have an H3, Paragraph, and Button. We can create spacing for these elements without creating a new class.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b58bbe94344098dbea473_spacer-spacing-strategy.png)

We use spacing blocks or wrappers to create space between each text element, which helps us avoid the creation of custom classes.

Our [Typography strategy](https://finsweet.com/client-first/docs/typography-strategy) encourages that we use few or no custom classes on our typography elements. We want to avoid creating new custom classes specifically for spacing typography elements.

Instead, we can pair our global typography strategy with our global spacing strategy to create text content layouts without custom classes.

###### **Benefit:** Avoid utility class deep stacking on text elements.

In Client-First, we want to keep our Headings and Paragraph font clean from non-typography classes.

Ideally, there are no classes applied to our typography elements. Using the default tag styles is best. If the typography has a variation from the default, we can place *text-* or *heading-* classes on it.

We want to avoid *margin-* or *padding-* classes directly to the text element. We will quickly approach deep stacking issues if we apply typography and spacing classes to text elements.

Spacing blocks and wrappers help us avoid deep stacking.

‍

‍**We do not want to do this:**

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/e549e7c4e18c32018ebdc27643197126/manifest/video.m3u8)

‍

The spacing block solves the issue of stacking spacing classes on the text element.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/97e096aa22749279d4074a8c720d86b8/manifest/video.m3u8)

With our spacing classes separated from our typography classes, we can manage each separately without the issue of deep stacking.

‍

##### 4. Spacing for reused symbols and components

###### **Benefit:** We can create instance-specific spacing for symbols and components.

When we want to apply spacing to symbols, the spacing must be applied to all instances of the symbol.

Unified symbol spacing may be a problem if instances of our symbol require different spacing values.

Using spacing blocks or wrappers, we can have different spacing for different symbol instances.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b5907fe2bbc52ef155952_spacing-for-reused-spacing-strategy.webp)

No combo class required, no new classes created, no custom CSS needed. Our spacing system gives us instance-specific spacing while using the core content stored in the symbol.

#### Use cases for spacing block strategy

##### 1. Create space between two elements

Spacing blocks are very useful when we create space between two elements. They're fast to implement, we have fewer nested levels, and our elements are more visible.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/926ee277d363622d62f8f8d9b584f738/manifest/video.m3u8)

##### 2. See children in Navigator

When we use spacing blocks, we create a clear view in Navigator. We can see all elements of the component.

Using too many spacing wrappers may "hide" too many of our important elements inside nested folders. Spacing blocks will create less nesting inside Navigator.

Spacing blocks show our important elements more visibly in Navigator.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b5928a5a2f97fb6d5832b_children-navigator-spacing-strategy.webp)

##### 3. Unique spacing for top and bottom of sections

When a section's padding-top and padding-bottom should be different, and we want to maintain the global utility class system, we can use spacing blocks.

We can apply a *padding-large* spacing block to the top of the section and a *padding-small* spacing block to the bottom of the section.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b593cb8aeee694ed3c7de_unique-spacing-top-bottom-spacing-strategy.webp)

#### Use cases for: Spacing wrapper strategy

##### 1. Use with CSS Grid spacing strategy

Using the [CSS Grid spacing strategy](#css-grid-strategy), we can quickly create equal space between children elements.

We can use spacing wrappers to create unique spacing for one element in the list. When spacing wrappers are used together with CSS Grid strategy, we can apply custom spacing quickly with less effort.

For example, a content item has 1rem between each child element — except the last item in the list.

We can apply *margin-top* *margin-small* as a spacing wrapper for the last item in the list.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/692dcf96336f259fc6a537e122e4d6de/manifest/video.m3u8)

The spacing wrappers allow us to use CSS Grid spacing without creating multiple custom classes.

#### FAQ — Are empty divs bad for my website?

We are commonly asked about the impact of empty divs and spacing-only divs used in the Client-First spacing system.

- Will search engines have trouble reading my website?
- Will I generate too many elements on the web page?
- Will there be a problem with accessibility?
- Will my project be more difficult to maintain?

The short answer — No.

As long as the empty divs don't have any content or accessibility attributes (like aria-label) added to them, screen readers will omit them.

Search engines will not be confused by blank divs either. An empty div with a CSS class is easy to identify by us humans and by search engines.

"Excessive DOM size" is a common error alert found in many web performance tools. For example, Google's [PageSpeed Insights](https://pagespeed.web.dev/). It is very unlikely that Client-First spacing system is the cause of this error. The most likely causes are layered animations, Lottie files, and embeds. These implementations can generate exponentially more DOM elements than Client-First spacing.

A web page built with Client-First guidelines has little or no impact in causing the "Excessive DOM size" performance alert.

Interested in further reading of empty divs? We loved reading [Don't Fear Empty Divs](https://www.coryetzkorn.com/blog/dont-fear-empty-divs) by Cory Etzkorn.

### Part 2: Custom classes

The Client-First utility spacing classes are not the only implementation method for spacing on our site.

We can apply margin and padding CSS properties directly to the custom class.

Inside the custom class mindset, we present 2 spacing strategies:

1. Custom class on element
2. CSS Grid parent spacing

Both strategies use a custom class to create space between elements.

When we use custom classes for spacing, we should have a good use case for the custom class. Fewer custom classes equals more consistency in spacing.

#### Custom class on element strategy

"Custom class on element" applies margin and padding values directly to the element that needs to be spaced.

For example, we apply *faq\_title* to a Heading that requires unique spacing, which the utility class system can not achieve. A CSS property of margin-bottom: 0.75rem is applied directly to the *faq\_title* class.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b595b72db2f7ee2e45b16_custom-class-spacing-strategy.webp)

This graphic applies a custom class and custom spacing **on the element**.

This strategy is the most flexible. We have total control of a specific element across all breakpoints. We must use this power with purpose.

By overusing this strategy, we can create too many custom classes for spacing. This may result in a disorganized project spacing system and many manual breakpoint updates.

#### CSS Grid strategy

CSS Grid spacing strategy applies CSS Grid to a parent wrapper which creates space for the children inside it.

We can create vertical and horizontal space between child elements using CSS grid.

Instead of applying many blocks, wrappers, or custom classes on elements in a list, we can use CSS Grid strategy to manage all children with one controller — the parent wrapper.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b596de055ccf13e0605de_CSS-grid-strategy-spacing-strategy.webp)

#### Use cases: Custom class on element

##### 1. Globally manage the spacing of a specific element

The key words are **"of a specific element"**.

###### When we have recurring elements that should have the same spacing value across the project, it may be best to use a custom class to manage the spacing. A custom class allows us to make spacing updates for this recurring element.

Global spacing wrappers on recurring elements may slow us down and make project management more difficult to manage.

We can ask ourselves two important questions to understand if we should use utility class spacing or a custom class for a specific element.

###### How many instances of **[this element]** are in the project?

If there are many instances of this specific element, the element is a recurring element in the project. We can target each instance by using a custom class.

For example, if there are 25 instances of this element in the project, we can use one custom class to target all 25 instances.

###### How do we want to manage each instance of **[this element]**?

If we want to manage each instance of [this recurring element] as one group, a custom class will help us target that group of elements and apply changes to the group globally.

##### Custom class on input example

Let's look at an example use case with form inputs in our project. Form inputs are used across 4 pages of the project.

The setup below shows each *form\_input* separated by a spacing block. This strategy is used across the entire project.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b5983e94344098dbef649_input-example-1-spacing-strategy.webp)

If we wanted to reduce the spacing between each *form\_input*, we would need to update each spacing block individually.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/45c40a822fbc8a0150a1e049ce250478/manifest/video.m3u8)

‍

This example above is not ideal, as this change may take unnecessary effort to update each form in the project. We must go input by input to update the spacing block value.

A change to all form inputs across the project can take seconds and require little effort with the proper setup.

A custom class on the *form\_input* will allow us to manage all *form\_input* elements as one unified element group.

This screenshot shows each *form\_input* with margin-bottom: 1remapplied to it.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b59a1589d4584c9060728_input-example-2-spacing-strategy.webp)

If we want to change the space between each input, we can make a single change to the *form\_input* class. Changing the margin will change the value for all inputs across the project.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/21ef738664285ed6cc7db41d2cbb2156/manifest/video.m3u8)

This example is ideal if we want all form inputs in the project to have a unified margin-bottom: 1rem value.

We have complete global control of spacing this specific element. We can change every form input on this page, and across the project, with a single change of the  *form\_input* margin-bottom CSS property.

‍

##### 2. Unique tablet and mobile spacing sizes

Spacing blocks and wrappers have the powerful benefit of maintaining default spacing across all breakpoints. However, we may not want default spacing across all breakpoints.

Sometimes we have elements that require unique spacing on tablet, mobile, or both. In this case, spacing blocks and wrappers will make our customizations more difficult.

Client-First utility class spacing is designed to unify spacing across all breakpoints. The system does not allow for customizations across breakpoints.

We can apply spacing directly to the custom class if we need spacing customizations across breakpoints. The custom class will allow us to manage the spacing across each breakpoint.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/67428f820c2f9d9e1f2ea3bc3b1d1f79/manifest/video.m3u8)

‍

##### 3. Unique one-off spacing

Sometimes we have an element that needs unique spacing. It's not part of a group of other elements, and doesn't have any specific mobile customizations. It's an element that requires a single use one-off spacing.

For example, a client insists that *padding-small* is too small and *padding-medium* is too large. They want something in the middle.

Instead of forcing this unique one-off into the utility spacing system, we can create a custom class for the element and continue with our build. For example, we can create *about\_testimonial-title* with margin-bottom: 2.25rem as a one-off unique spacing class.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b59ba359714d42aff516e_unique-off-spacing-spacing-strategy.webp)

When we are not clear on integrating the utility spacing system into the layout, we can create a one-off spacing for this specific element.

It's important to understand that the more we create one-off custom classes for spacing, the less we follow a globally unified spacing system. This should not be a common practice for every element.

#### Use cases: CSS Grid spacing

##### 1. Spacing children elements in a list

The core use case for CSS Grid is spacing items in a list. When there are sibling elements that need the same space between each other, applying CSS Grid to a parent wrapper is an efficient way to space these elements.

##### CSS Grid footer links example

Let's look at an example use case with links in the footer.

We have a parent wrapper called *footer\_links-column* that wraps footer links. We can apply display: grid with rows to create equal space between all footer links.

If we want to change the space between each footer link, we can make a single change to the *footer\_links-column* class. Adjusting the row distance will adjust the space between all footer links.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/51678067f207c89f12577a8cd3ac9674/manifest/video.m3u8)

This is an excellent strategy for alist of items that require spacing. One adjustment gives us flexible control of the spacing between the items.

##### CSS Grid content card example

CSS Grid spacing also works with children of content items.

We have 'content card' items nested inside a list. Each content card has elements nested in it. We can apply CSS Grid directly to the content card to space the icon, title, and paragraph inside it.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/0186f6f65a77b0092ef0ae21a41d79d8/manifest/video.m3u8)

CSS Grid is applied to the *benefits\_item*, and the elements inside are influenced.

We can adjust the CSS Grid row values and adjust all *benefits\_item* contents together with one controller.

‍

This strategy works very well if the spacing between each child element is equal. In our example, the spacing between each child element of the *benefits\_item* is 1rem. This scenario fits perfectly into CSS Grid row controls.

To add a child element with different spacing values in the CSS Grid, we can use our utility class [spacing wrapper method](#use-cases-spacing-wrapper) together with the CSS Grid method.

In the example below, we add a button to the content card. This button requires 3rem distance below the paragraph. This does not work with the Grid values applied to *benefits\_item*.

We can add a spacing wrapper under the paragraph that wraps the new button.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b5a0da5a026456e948fb9_card-example-spacing-strategy.png)

Now spacing wrapper *padding-top* *padding-medium* is creating additional space within the *benefits\_item* CSS Grid system.

Spacing wrappers are excellent for using CSS Grid spacing strategy with flexibility and variation.

This works well for creating global controlled content spacing.

The *benefits\_item* may be a recurring component throughout the site.

Some *benefits\_item* cards have a CTA, some don't have a CTA, and some may have entirely new elements.

We can keep a global and unified *benefits\_item* spacing with our CSS Grid controls while taking advantage of instance-specific elements and spacing variations.

### Responsive spacing

Create responsive spacing variants is the *spacer-* class system.

The *spacer-* system uses only one class, so adding a second class to create a responsive variant combo class is Client-First approved.

The two-class strategies already have two classes applied to an element. Adding a third would start to create a long stack of classes (3 classes). More importantly creating a combo class from a stack of classes that is likely to change is not a good combo class creation strategy. We discourage and avoid responsive variants on two-class spacing block and spacing wrapper strategies.

#### *spacer-* tablet and mobile flexibility

Use *is-* combo classes to make customizations to base breakpoint utility spacing.  
  
If an element needs *spacer-large*, but a small breakpoint needs a unique spacing size, we can add a combo class to the *spacer-* class to customize lower breakpoint spacing. For example, if we need smaller space on mobile only, we can use *spacer-large* *is-mobile-small*.  
  
If the responsive customization is focused on a specific element, we can be more specific with our combo class naming, such as *spacer-large* *is-home-tabs*. The use of the combo class allows us to maintain global utility spacing across desktop and then make instance-specific customizations for smaller breakpoints.

### Spacing tips

#### *padding-section-[size]*

*padding-section-[size]* is a set of utility classes that help us manage top and bottom padding for sections globally throughout the project.   
  
The *padding-section-[size]* utility class should be used on the div block with the *padding-global* class applied to reduce nesting elements as example below:

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b5a2246ce1c02887c37a9_padding-section-spacing-strategy.webp)

This is a hybrid approach between custom class and utility class. We can manage all of our section spacings as a global utility class.

A new folder called *section-* is added to our *padding-* utility class folder.

*padding-section-small*  
*padding-section-medium*  
*padding-section-large*

If a section's vertical padding is something custom or unique, we can:

- Recommended: Use spacing blocks to create unique space on the top and bottom of the section. This method maintains the utility spacing system.
- Apply the unique padding to the outer section layer, *section\_[section-identifier]*

#### Optionally add margin on Heading tags

We may want each Heading tag to have the same amount of space above and below. We want to unify the spacing in our typography system.

For example, every H2 in the project has margin-bottom: 2rem‍

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b5a3c8861b35ea6b3e2e6_margin-heading-spacing-strategy.webp)

###### Applying margin to the Heading tag is an effort to unify spacing above and below our Heading tags. This is how we create global spacing rules for our typography.

Margin on Heading tags works well if we have design control over the project. We can choose to have a very formalized spacing system. This is a method to unify typography in the project further.

If we are working on a website with many variations in Headings and how Headings are used in the design, this may not be a good strategy.

If we continue overriding the default Heading margin values, we create more work for ourselves.

If all or most Headings should follow the same margin across the project, this may be an effective strategy.

We have a full explanation of this typography spacing method in [Typography strategy](https://finsweet.com/client-first/docs/typography-strategy).

#### Flex or grid for buttons and button rows

Use CSS flex or grid to create simple button layouts.

##### Button with icon example

Create a button with text and an icon. Apply flex or grid to button element to create space between the text and the icon.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/6e6c2de0fb13ba9f65b3105a54a39771/manifest/video.m3u8)

This is a quick and simple way to implement a button with multiple nested elements.

##### Button row example

Create horizontal space between two buttons. Apply the horizontal space between the buttons through the parent wrapper.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659cbe2df8fd995701c81a56_button-group-spacing-strategy.webp)

Using flex or grid on the parent wrapper of the buttons, we can create horizontal space between the buttons.

Applying margin-right directly to the button class will limit how we can use our *button*. We want our *button* to work in all instances, not only in a row of buttons.

Applying spacing blocks for horizontal margin may not work well for mobile. Many mobile designs require specific horizontal spacing. Spacing blocks do not allow us to make adjustments for mobile design.

We believe flex or grid for creating space in a row of buttons is ideal.

#### Avoid using utility padding to create size for inner elements

We don't recommend using the utility classes to create padding around the item content. This strategy works in terms of CSS and may achieve our required result, but we want to avoid this practice. It encourages deep class stacking and mobile styling conflicts.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b5a55d931304595a6fa88_avoid-inner-spacing-strategy.png)

Usually, the padding for inner elements will need specific size customizations through each breakpoint. Client-First spacing system has no control of spacing values across breakpoints.

Instead, apply the inner element padding directly on the custom class.

#### Create a custom class folder of spacers

The term "spacer" can be used for custom classes as well.

We formally use it as a utility class system: (*spacer-*)

We can also use it as a custom class to manage all custom unique spacings across the project (*spacer\_*).

If there is a recurring element where spacing should be managed globally, we can use *spacer\_[element]* to manage that  custom element spacing. This new *spacer\_* folder is useful for organization of all custom element-specific spacing that should be kept global.

*spacer\_header*

*spacer\_sticky-nav*

*spacer\_title-primary*

*spacer\_title-subtitle*

*spacer\_footer*

We can use this *spacer\_* folder for anything, even something custom like *spacer\_home-faq*.

---

<!-- source: https://finsweet.com/client-first/docs/utility-class-systems -->

CONCEPTS

## Utility class systems

Review the utility class systems included with the official Client-First project cloneable. We start each project with this set of utility classes.

### Intro

Client-First cloneable includes utility classes and styles that help us start any Webflow project.

These classes are not specific to any website, design, style, or layout. Utility classes manage important CSS properties used throughout many pages, sections, or elements.

Some utility classes allow us to make powerful global changes to elements throughout the build. For example, a class that applies universal horizontal padding.

Some classes are for improved workflow. For example, a class that applies display: none.

It's important to know that all included utility styles inside Client-First are optional. If the build requires us to organize spacing differently or use a unique structure for outer page structure, we may do it. We find that most projects work very well with the utility classes inside Client-First.

#### Most important utility systems

Three primary global utility class systems come with Client-First — Core structure, typography, and spacing.

We have identified these as our most essential global-use classes when building in Webflow. Each global utility class system has a dedicated strategy page to explain how we use it.

### Structure

Defined and flexible Core Structure we can use on all or most pages.

#### Global horizontal padding

Global horizontal padding manages the left and right padding of a page's content.

- *padding-global*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b63a77f8b7cf2510045af_padding-globalutility-class.webp)

#### Container size

Global max width values that serve as max-width containers for content.

- ‍*container-large*
- *container-medium*
- *container-small*

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/99d6b83c12436fe49830a24d96f0a353/manifest/video.m3u8)

> Learn more about core structure in [Core structure strategy](https://finsweet.com/client-first/docs/core-structure-strategy).

#### Section padding

Section padding manages a global vertical spacing system for sections.

- *padding-section-small*
- *padding-section-medium*
- *padding-section-large*

The *padding-section-[size]* utility class should be used on the div block with the *padding-global* class applied to reduce nesting elements as example below:

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/8234fff94f4b0418d4519475bf36b556/manifest/video.m3u8)

### Typography

Client-First includes a global utility system for headings, typography sizing, coloring, and customizations.

#### HTML tags

We always use the HTML tag to define default Heading styles.

- body
- H1
- H2
- H3
- H4
- H5
- H6

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/bbd21be6a15b553193778c2268a3be5e/manifest/video.m3u8)

#### Heading style switch

Change the default Heading style.

Use class prefix *heading-style-* on H1, H2, H3, or any other piece of text to change the text to a specific H heading size. For example, if we have an H2 that should be styled like an H3, we can use H2 for SEO purposes and apply *heading-style-h3* to the element.

- ‍*heading-style-h1*
- *heading-style-h2*
- *heading-style-h3*
- *heading-style-h4*
- *heading-style-h5*
- *heading-style-h6*

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/12c4daaa09d2c7de17576e8ecd815762/manifest/video.m3u8)

#### Text size

Use class prefix *text-size-* on a text element to change the size of the text.

- ‍*text-size-large*
- *text-size-medium*
- *text-size-regular*
- *text-size-small*
- *text-size-tiny*

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/913e07e34ad41ab49261e9b3f4dd7b2b/manifest/video.m3u8)

#### Text style

Use class prefix *text-style-* on a text element to change the style of the text.

- *text-style-allcaps*
- *text-style-italic*
- *text-style-link*
- *text-style-muted*
- *text-style-nowrap*
- *text-style-quote*
- *text-style-strikethrough*
- *text-style-2lines*
- *text-style-3lines*

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/0d56fefbbb510a437441c281a46b617b/manifest/video.m3u8)

#### Text weight

Use class prefix *text-weight-* on a text element to change the weight of the text.

- ‍*text-weight-xbold*
- *text-weight-bold*
- *text-weight-semibold*
- *text-weight-normal*
- *text-weight-light*

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/758f35d223ac676edafa4b5a5110ac24/manifest/video.m3u8)

#### Text alignment

Use class prefix *text-align-* on a text element to change the alignment of the text.

- ‍*text-align-left*
- *text-align-center*
- *text-align-right*

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/79779ba5e146fa2d06d5c204d54baef1/manifest/video.m3u8)

#### Text color

Use class prefix *text-color-* on a text element to change the color of the text.

- ‍*text-color-primary*
- *text-color-secondary*
- *text-color-alternate*

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/e29b806e47466149947076f2bbbb32a0/manifest/video.m3u8)

#### Buttons

Use class prefix button- to use a button style.

- ‍*button*
- *button* *is-secondary*
- *button* *is-text*

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/298096b0ddcfef21ffca8174d656dedf/manifest/video.m3u8)

> Learn more about typography in [Typography strategy](https://finsweet.com/client-first/docs/typography-strategy).

### Spacing

Spacing system that keeps vertical and horizontal spacing global on our website.

To learn more about margin and padding classes, review the [Spacing strategy](https://finsweet.com/client-first/docs/spacing-strategy) page.

#### Margin direction

- ‍*margin-top*
- *margin-bottom*
- *margin-left*
- *margin-right*
- *margin-horizontal*
- *margin-vertical*

#### Margin size

- ‍*margin-0*  0rem
- *margin-tiny* 0.125rem
- *margin-xxsmall* 0.25rem
- *margin-xsmall* 0.5rem
- *margin-small* 1rem
- *margin-medium* 2rem
- *margin-large* 3rem
- *margin-xlarge* 4rem
- *margin-xxlarge* 5rem
- *margin-huge* 6rem
- *margin-xhuge* 8rem
- *margin-xxhuge* 12rem
- *margin-custom1* 1.5rem
- *margin-custom2* 2.5rem
- *margin-custom3* 3.5rem

‍

**How it works:**

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/273d8245445e28cebce6a0e5a112826c/manifest/video.m3u8)

#### Padding direction

- ‍*padding-top*
- *padding-bottom*
- *padding-left*
- *padding-right*
- *padding-horizontal*
- *padding-vertical*

#### Padding size

- ‍*padding-0* 0rem
- *padding-tiny* 0.125rem
- *padding-xxsmall* 0.25rem
- *padding-xsmall* 0.5rem
- *padding-small* 1rem
- *padding-medium* 2rem
- ‍*padding-large* 3rem
- *padding-xlarge* 4rem
- *padding-xxlarge* 5rem
- *padding-huge* 6rem
- *padding-xhuge* 8rem
- ‍*padding-xxhuge* 12rem
- *padding-custom1* 1.5rem
- *padding-custom2* 2.5rem
- *padding-custom3* 3.5rem

‍

**How it works:**

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/212a5d3fff1f408cbb3b8e7b3627880e/manifest/video.m3u8)

#### Remove all spacing

Sets all margin and padding to 0. Useful for removing native Webflow component spacing.

- ‍*spacing-clean*

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/a3591671a8d644df773a6e5f5d6034b7/manifest/video.m3u8)

> Learn more about spacing in [Spacing strategy](https://finsweet.com/client-first/docs/spacing-strategy).

### Useful utility systems

Utility classes we like to use in most of our projects to build faster.

#### Responsive hide

Show and hide elements by screen size.

- ‍*hide* - hide on all devices
- *hide-tablet* - hide from tablet resolution
- *hide-mobile-landscape* - hide from mobile landscape resolution
- *hide-mobile-portrait* - hide from mobile portrait resolution

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/b6c43903790df645f31693db2cc2f2ca/manifest/video.m3u8)

#### Display inline flex

Apply CSS property display: inline-flex, which is not a supported CSS property in Webflow.

- *display-inlineflex* - Sets display: inline-flex at the base desktop breakpoint.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/dede8f0be604eff68b10ca4e74a1352d/manifest/video.m3u8)

###### **Use case:** Using the CSS property display: flex is usually important in our project. However, display: flex causes elements to take up 100% of the space by default. This makes it difficult to use flexbox for buttons. display: inline-flex allows elements to behave as inline, while maintaining flex capabilities inside them.

#### Max width

Add max-width to any element on the page.

Use *container-* classes for the primary outer content max width. Use *max-width-* classes for max width use cases nested within the *container-*.

- ‍*max-width-xxlarge* 80rem
- *max-width-xlarge* 64rem
- *max-width-large* 48rem
- *max-width-medium* 32rem
- *max-width-small* 20rem
- *max-width-xsmall* 16rem
- *max-width-xxsmall* 12rem

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/9cc3b428dc27a6dbd13679cef71c9ef1/manifest/video.m3u8)

‍

##### Max width full

Sets max-width: none.

- ‍*max-width-full* - sets max-width to none
- *max-width-full-tablet* - sets max-width to none on tablet
- *max-width-full-mobile-landscape* - sets max-width to none on landscape
- *max-width-full-mobile-portrait* - sets max-width to none on portrait

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/bebfc6b3fc5dcf7d6a180dde928af85a/manifest/video.m3u8)

‍

#### Icon sizes

Sets a height or height and width of icons. Icon 1x1 sets both width and height values. Useful for social icons, company logos, footer assets, etc.

- ‍*icon-height-small*
- *icon-height-medium*
- *icon-height-large*
- *icon-1x1-small*
- *icon-1x1-medium*
- *icon-1x1-large*

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/b0aed599bddd3a85c7721fa316a85828/manifest/video.m3u8)

#### Background colors

Background colors help apply a recurring background-color CSS property to elements in our project.

- ‍*background-color-primary*
- *background-color-secondary*
- *background-color-tertiary*
- *background-color-alternate*

[">

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/f3941f03be438e4d011d3200256f716a/manifest/video.m3u8)

#### Useful utilities to build with

More advanced uses. Not required to use.

- ‍*z-index-1* - sets z-index: 1
- *z-index-2* - sets z-index: 2
- *align-center* - sets margin-left and margin-right to auto, centers an element inside its parent div.
- *layer* - sets position: absolute with 0% on all sides. Add this class to a div to make it expand the entire size of the parent element. Make sure the parent div has a position that is any other than static.
- *pointer-events-none* - sets pointer-events: none, which prevents all click and hover interaction with an element.
- *pointer-events-auto* - sets pointer-events: auto, which enables all click and hover interaction with an element

- *overflow-hidden* - sets overflow: hidden
- *overflow-scroll* - sets overflow: scroll
- *overflow-auto* - sets overflow: auto
- *aspect-ratio-square* - sets aspect-ratio: 1 / 1
- *aspect-ratio-portrait* - sets aspect-ratio: 2 / 3
- *aspect-ratio-landscape* - sets aspect-ratio: 3 / 2
- *aspect-ratio-widescreen* - sets aspect-ratio: 16 / 9

### Global embed

Client-First comes with a symbol embed block that holds our global site-wide custom CSS styles. This embed block symbol should go on every page of the project.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b63b880468e6edfbfca35_global-embedutility-class.webp)

Custom CSS styles are best implemented through the native embed block — not Page Settings or Site Settings custom code.

##### Styles are added to an embed so we can see the CSS inside Designer

The ability to see our CSS inside the Designer canvas is the primary reason we use the symbol embed block instead of Site settings.

When the code is in Site Settings, we can only see the CSS on the published site.

When the CSS styles are in an embed inside Designer, we can see these styles visually while we work inside Designer. In most cases, it's preferred to see custom CSS styles directly inside Designer.

##### Update a few Webflow default styles.

We have several styles inside the symbol that overwrite default Webflow styles, which we prefer not to have in our project.

##### Built for adjustments and updates

The Client-First utility styles and the global embed block styles can be changed based on our project.

The cloneable starter project includes comments for each style inside the embed. If you are unsure what the custom CSS does, leave it and do not delete it. Each line in the global embed is there for a reason and is likely beneficial to the project.

##### Learn more about the Global embed

The [Global embed page](https://finsweet.com/client-first/docs/global-styles-embed) explains each CSS snippet in the embed. Understand each snippets use case and why it's part of the Client-First cloneable.

---

<!-- source: https://finsweet.com/client-first/docs/classes-strategy-2 -->

CONCEPTS

## Classes strategy 2

Theory of best workflow practices for classes in Webflow Designer. Learn about global classes, stacking classes, and why we don't deep stack in Client-First.

### Custom class creation

Make sure to understand the definition of a custom class in Client-First. See the definition in [Classes strategy](https://finsweet.com/client-first/docs/classes-strategy-1).

Client-First recommends creating and using custom classes for many of elements inside the project.

Although there is a mix of custom classes and utility classes, a majority of most projects will be custom classes

#### Benefits of custom classes

##### 1. Fast creation

Webflow as a platform was designed around visually styling our web page with the Styles panel. The Styles panel is our big win in Webflow. We can create new classes and apply styles to that class very quickly.

###### We believe applying classes through the Styles panel should be done freely and frequently inside our workflow.

In traditional website development, creating custom classes for many elements is time-consuming. Classes and styles are written by hand, and writing CSS properties by hand is time-consuming. This is why fully utility-based class systems are recommended in traditional web development.

In Webflow, we have the benefit of the Styles panel, and we must take advantage of it.  
‍

In this video, we write out the styles for *team-list\_* by hand.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/df022049441c034867edffd272e18a30/manifest/video.m3u8)

In this video, we visually create the styles for *team-list\_* in Webflow.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/571a0cb511bd3c1688449e68cee4fa2c/manifest/video.m3u8)

##### 2. Easier to customize and safer to edit

Editing the styles of a custom class vs. utility class is very different.

Customizing an instance-specific custom class can often be very straightforward and quick. In our *team-list\_* example, we need to add an additional style to our display: flex settings.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/e73a3de6389c4e1a959caab72877e032/manifest/video.m3u8)

We are influencing this element specifically and do not have to worry about making a global site-wide mistake. By editing global classes, we may accidentally update elements in the project that we do not want to edit. Editing global utility classes takes more thought and carefulness.

##### 3. Tablet and mobile responsive updates

Desktop design may be very different from tablet and mobile design. There are likely customizations across breakpoints for many elements in our project.

Using custom classes, we can freely make updates across breakpoints. Elements with a dedicated custom class have the flexibility to be styled uniquely on tablet or mobile.

In this example, we change the *team-list\_* to look different on tablet and mobile. The custom class allows us to make this change with the Styles panel.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/beeeff0340d99c25eaa2b3f0d9e6a01b/manifest/video.m3u8)

When using utility classes and making responsive style updates, we need additional utility classes that give variations for responsive breakpoints.

##### 4. Working with clients

Clients often have feedback and requests that don't follow the default.

"Make this spacing smaller", "Make this box bigger", "Change the color from blue to red", "Change the order of this on mobile", etc.

Client requests can be "random" in that they don't always follow the defaults of a utility class system. Custom class use can help us better manage these random requests.

Clients ask for updates during development and after launch. We feel more comfortable updating a specific element with a custom class rather than a utility class system.

If the client update doesn't fit into the utility class system in the project, the update becomes more difficult. We will need a new class to complete the update.

With a custom class, we can implement style updates quickly.

### Using global classes

Make sure to understand the definition of a global class in Client-First. See the definition in [Classes strategy](https://finsweet.com/client-first/docs/classes-strategy-1).

A global class should be simple, powerful, and meaningful.

#### Benefits of global classes

##### 1. Manage style values globally across the website.

A global class should be meaningful — It may hold a value to an important set of styles that are managed on a global level.

For example, the Client-First container classes. *container-large* has a max-width value of **80rem (1280px)**. If we want our container max-width reduced across the entire website, we can update *container-large* to **75rem (1200px)** in one style change.

This is a global change that updates all instances of *container-large* throughout the project.

*container-large* is a powerful global controller inside our project.

##### 2. Faster build time, efficient use of common styles, client convenience.

We may want to use a CSS style as a utility class to help us build faster. For example, *hide-tablet* or *hide-mobile-portrait*.

These classes will allow us to selectively change the visibility of elements throughout the website as we're working — without creating additional classes and combos specifically for hiding an element. This utility class can help us work faster inside Designer.

In the example below, we want to hide the last two items in this list for mobile-only. We use *hide-mobile-portrait* to hide the last two without creating a new class.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/e614c6b06fab2013edb232dc54af78a6/manifest/video.m3u8)

Understand that this is not a CSS property that would need to be updated globally. It is unlikely that we would want to show all instances of hidden mobile elements in the project. The goal of this utility class is to improve workflow, while reducing additional custom classes.

#### Meaningful use of global classes

If a global class does not fall under one of these two benefits, it may not be a beneficial use of a global class.

We can ask ourselves these questions:

> Does this style have any benefit of being managed globally?

> Does this lead to faster build time, efficient use of recurring styles, or client convenience?

We only want to create and manage a global class if it falls under one of these use cases.

##### Position absolute example

For example, let’s look at a global utility class called *position-absolute*, which adds CSS property position: absolute to an element.

There is no reason to change the styles of this class globally. What CSS properties will we update in *position-absolute*? There is no meaningful reason to update this class globally across the project.

position: absolute is usually not a CSS property that can exist independently. It likely requires additional CSS properties to create a meaningful position.

It’s unlikely that a *position-absolute* style will improve our build speed since it needs the addition of stacked classes. There will likely be further class stacking for tablet and mobile responsive updates.

Therefore we suggest applying CSS properties like position directly to a custom class.

We do **not** recommend using a class such as *position-absolute* as a global class.

##### Dark section example

Global classes should have a purpose for global updates. An update to the class should significantly benefit global site-wide updates.

For example, we may use the class *section-dark* to apply color: #ffffff and background-color: #000000 to a section. If *section-dark* is applied to many sections throughout the project, we can make powerful global updates to our dark sections.

For example, changing background-color: #000000 to background-color: #111111 can be made to one class, *section-dark*, and that update will be reflected across the entire project.

### Stacked global classes

> Stacked global classes can help us apply multiple global styles to a single element.

We must approach class stacking with a strategy. Our build can become unmanageable if we stack too many classes on an element.

#### Stack similar classes

We recommend stacking global classes from the same CSS property or category type. For example, we want to stack:

- Margin classes with margin classes
- Padding classes with padding classes
- Width classes with width classes
- Typography classes with typography classes

Stacking of similar classes is not a strict rule. It is a practice that helps us stay more organized and flexible inside the project. By using this method, we eliminate many cases of deep stacking.

If we have a mix of class properties on an element, our class list grows and introduces a deep stacking problem.

#### Examples

Let’s look at two examples — margin and typography.

##### Margin

Client-First spacing system uses a stacked global class approach. First, we apply the direction class, *margin-top*. Then we apply the size class, *margin-large*.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/414a40d7dd9bf7aa02eacafaa7000f4e/manifest/video.m3u8)

‍**We do not want to add more classes on top of this.**

For example, we would not add a max-width category class on top of our margin classes.

We approach deep stacking if we add additional classes on top of *margin-top* *margin-large*. If we place *max-width-small* in addition to the spacing wrappers, we prevent quick changes to our *margin-large* class. We have to remove *max-width-small* before changing *margin-large*.  
‍

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/30b763f2b077e6ab1f8b11df5cf83a14/manifest/video.m3u8)

This concept applies to all other class categories. We want the Div Block with the margin classes to have margin classes only.

##### Typography

A text element may require multiple global typography classes. In this case, we can stack multiple classes on the text element.

For example, a large size text that also has a gray color. A text element can get the classes *text-size-large* and *text-color-neutral* to receive the styles.

**As with margin, we do not want to add more classes on top of this.**

We want our typography classes easily accessible inside the styles panel. If we're going to update *text-size-large*, we do not want to remove many classes after it to access the base class.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/97056c507526e102c624a6371892fefb/manifest/video.m3u8)

#### Don't add new styles to stacked global classes

We don't want to add new styles to stacked global classes because it will create a new class (a combo class) to the CSS of the project.

Creating instance-specific combo classes from global utility classes, defeats the purpose of true global utility classes. This practice can lead to organization issues as the website scales.

Let’s continue with the examples above — margin and typography.

##### Margin example

We never want to create a new class with our stacked margin classes. If we have *margin-top* and *margin-large*, we **should not apply** any styles to this stacked combination.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/ce8948a04a0e28af635aa37429890499/manifest/video.m3u8)

Applying styles like this will create a new class. We will write a new set of styles to the CSS style sheet.

##### Typography example

We never want to create a new custom class with stacked typography classes. If we have *text-size-large* and *text-color-neutral*, we should not apply a new custom style to the stacked classes.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/5c9bdec6fd0ffb03e9e58b2d6b2c77df/manifest/video.m3u8)

This also results in the creation of a new combo class.

##### Solutions

Instead of creating a new class from stacked global classes, we propose using these two strategies.

**1. Start with a custom class from the beginning.**

Instead of creating a combo class *text-size-large* *text-color-neutral*, create a *home-header\_text* custom class with size, color, and the additional CSS style. This gives us complete style flexibility to add custom styles to the element.

However, we will not inherit any global styles of the text. If we use this method too much, we will no longer have the benefits of globally controlled typography.

‍

**2. Use an additional class to create the combo class.**

We create our combo class by adding a new class in addition to our utility classes. The class is called *is-home-header*, and a combo class is created for all three classes.

This method maintains important style properties in *text-size-large* *text-color-neutral*, while customizing the instance with *is-home-header*. *is-home-header* holds all of our custom styles for this instance.

This method is most valuable when we want certain CSS styles to stay global across the project. In this example, CSS properties font-size (*text-size-large*) and color (*text-color-neutral*) remain globally controlled.

### Combo classes

#### What is a combo class?

> A combo class is a variant to a base class. A combo class inherits styles from the base class and adds more styles on top of it.

We define the "base class" as the first class in our list of stacked combo classes in a combo class. We add a class on top of the base class to create a unique variation.

The combo class will only work when combined with the base class(es) before it. In the video below, understand that *is-brand* does not work alone. It only works as an addition to the base *button* class.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/a03a7df088344d7e009507f226203cbf/manifest/video.m3u8)

‍

The key difference between a stacked global utility class and a combo class is:

- A combo class creates a new class and adds a new style declaration to the CSS file of the project.
- Stacked global classes do not create a new class or style declaration in the project.

#### -is prefix

To stay organized and straigthforward with our combo class use, we use *is-* as a prefix in the class name. When we see *is-* we know this class is created as a combo class on top of another class.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659bf32bdb9e1f70a632b854_is-prefix-class-strategy-2.webp)

#### Inheriting styles from the base class

> Combo classes have one core requirement for creation — the combo class must have a clear benefit for inheriting styles from the base class.

In a combo class, we define the "base class" as the first class in our list of stacked combo classes. The base class should hold the default styles that any custom variant builds in addition to.

The class added on top, which creates the combo class, is the variant. Each variant should have a good use case to inherit the styles from the base class.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/89e09454281ec6891697c09e85dbe272/manifest/video.m3u8)

‍

##### Button example

Let’s look at an example of a button combo class system.

The *button* class is our base class. All style variants below are on top of the *button* class.

*is-primary*, *is-alternative*, *is-inactive*, *is-dark*

We can add these styles to *button* to show a variation. It's crucial to understand that the *is-* classes will not work alone. They will only work as an addition to the *button* class.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/96c0ab4d7e1051825a0c2b193ca9b193/manifest/video.m3u8)

‍

The *button* class is an important base class in this example.

We want all of our buttons, regardless of the variant, to have the same padding and font-size. We define these properties in our *button* base class.

Each of the *is-* variants inherits these important global styles from the *button*.

This button combo class system allows us to globally update the padding and font-size CSS properties for all buttons across the project. All default buttons, and all variant buttons, will receive the global style update.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/b7afc5fa7c6b67f58fe7fc24ba97376a/manifest/video.m3u8)

There is a clear benefit of being able to manage these styles globally. We can make significant site-wide changes to all buttons with one class update.

This button combo class strategy is an excellent example of powerful and efficient use of combo classes.

#### Combo classes with purpose

Combo classes are powerful, and we must use them with care and purpose. A poorly built combo class system can cause scaling and organization problems inside the project.

There must be some use case to inherit styles from the base class. If there is no use case, there may not be a reason to use a combo class system. It may be better to create a single custom class that holds all stacked styles.

##### Container example — Unneeded combo class system

We will review an example of a *container* combo class system with no clear purpose of combo class benefit.

Our *container* class modifies several settings: margin: 0 auto, width: 100%, and a variable max-widthvalue.

It is tempting to create combos of *container* *is-large*, *is-medium*, *is-small*. It seems like a perfect use case for combo class because we have two shared CSS properties and one variable size property.

However, the two shared CSS properties — margin and width — are not CSS properties we should manage globally on a base class. It is not good practice to change these properties to any other values. For example, we would not want to change width: 100% to width: 90%. Additionally, we would not want to change the margin: 0 auto values.

Since we do not need to manage margin or width in the base class of *container*, there is no benefit in a combo class management system. The only property value we need to modify is our max-width class.

Instead of *container* *is-large* combo class we apply all styles directly to a single class — *container-large*. We always prefer to work with a single class instead of a combo class. If a combo isn't needed, we don't want to use it.

Additionally, with the size name in the class name, we improve the scannability of our class names in the Navigator panel. We will see *container-large* as the class name instead of *container* only.

##### Typography example — Inheriting desktop, customizing for mobile

We need to customize a text element because it is unique on mobile. On desktop and tablet, this element follows the default *text-size-large* style. On mobile, it requires a unique update that does not fit into our global utility class by default.

**1. Start with a custom class from the beginning.**

We have the option to create a new custom class to manage the typography across all breakpoints. For example, *home-header\_text-subtitle*. With this strategy, we do not use the utility class system. The downside to this strategy is that we no longer maintain the global size values for desktop and tablet. If we wanted to make a global update to our *text-size-large* on desktop, the custom class does not get that change.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659bf345ceca4971392937a7_typo-example-class-strategy-2.webp)

**2. Use an additional class to create the combo class.**

If globally managed typography is important in our project, we can consider a new combo class. For example, *text-size-large* *is-home-header*. The benefit of this implementation is that we can maintain our global styles on desktop and tablet and then only customize them for mobile. When we make a global change to our *text-size-large* class on desktop this element will receive those updates through the global system.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659bf35b4ee19afb14afc447_typo-example-2-class-strategy-2.webp)

##### Using this strategy with other utility classes

This concept works for other utility class systems in the project. For example:

*icon-medium* *is-footer*  
*button-primary* *is-nav*  
*heading-medium* *is-mobile-effect*

Make sure there is a purpose in creating a combo class from a global utility class. There should be a clear use case to maintain the global styles and then add additional styles.

Don't deep stack! The *is-* combo class strategy becomes less effective when there's a series of stacked global classes. For example, *text-size-large* *text-color-primary* *text-style-underline* *is-testimonials-title* are too many stacked classes.

We want to avoid deep stacking at all times.

### Don’t deep stack

#### Reasons to not deep stack

##### 1. Workflow problems in Webflow Styles panel

We don’t have free control over combo classes in Webflow.

- We are unable to reorder stacked classes inside the Styles panel.
- We can not make edits to deep stacked classes on mobile breakpoints.
- We do not have complete control to manage stacked classes inside Designer visually.

Removing all of the later classes in a deep stacked class list is a difficult process. As the class list becomes longer, there is a higher chance for error and frustration when making edits.

We believe this is a non-efficient workflow and an inherent issue with Webflow UX.

We have designed this Client-First principle specifically around the way Webflow’s Designer UI allows us to interact with stacked classes.

##### 2. Many steps for small changes

The limitations in the section result in a time-consuming process when editing deep stacked classes.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/5c9bdec6fd0ffb03e9e58b2d6b2c77df/manifest/video.m3u8)

Deleting a list of classes to remove a single class early in the deep stacked list is not a fun practice. We may become frustrated with these extra steps if this is a constant practice in our workflow.

Additionally, we have workflow issues with class editing for mobile breakpoints. When we need to make customizations specific to mobile, we may have style conflicts from earlier stacked elements.

##### 3. Increased learning curve

We believe that deep stacking leads to a larger learning curve because there is a deeper requirement for understanding what the classes do.

A user entering the project must

- Have a strong understanding of CSS
- Understand what each class in the stacked list is doing
- Understand the nuances of class stacking in Webflow

We believe this increases the learning curve for our project.

> When we use Client-First, we want to lower the learning curve continually. We should push ourselves to create elements, use classes, and implement strategies that are easy to understand, manage, and scale. This is what makes a powerful Webflow project.

##### 4. Writing CSS in Webflow is fast

We don't need to save time writing CSS in Webflow.

Explained in full above [Custom class creation > Benefits of custom classes > 1. Fast creation](#benefits-of-custom-classes).

##### 5. There is a tiny CSS savings

Example of small CSS savings — For example, load times of a 52kb CSS file vs. a 65kb CSS file is a negligible.

We do not believe the relatively low savings in the CSS style sheet outweigh the benefits of custom class creation.

#### Deep stack limits

In Client-First we stack, but we don't want to deep stack. Below we look at the number of classes stacked on an element.

##### 1 or 2 classes on an element

Great. This is common.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659bf376fef49f72a2f291e6_deep-stack-limits-1-class-strategy-2.webp)

##### 3 classes on an element

Ok, but why do we need 3 stacked classes? Is it necessary?

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659bf38ca52b933600a3311d_deep-stack-limits-2-class-strategy-2.webp)

##### 4 classes on an element

Absolute maximum stacking. Do we really need 4 stacked classes?

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659bf551fa40353fbaec4468_deep-stack-limits-3-class-strategy-2.webp)

##### 5 classes on an element

Too much. It will be difficult to manage. Create a custom class.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659bf3b90e6b3e4fda75c178_deep-stack-limits-4-class-strategy-2.webp)

#### Strategies to avoid deep stacking

##### 1. Use one single custom class

Rather than stacking multiple classes, we can start with one single custom class. We can style the element with one class without any class stacking. Our stacked styles will be applied to a single custom class.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659bf58139f1cc01a8b257fc_avoid-deep-stack-1-class-strategy-2.webp)

##### 2. Nest another Div Block

When our classes stack too high, we can create a nested Div Block that manages an important style.

The core structure used in Client-First takes this approach. Instead of stacking many classes on one element, we break up classes by type and use several nested layers of elements.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659bf59446ce1c0288dba234_avoid-deep-stack-2-class-strategy-2.webp)

A nested layer separates styles that have different purposes. We maintain our global utility class system while avoiding deep stacking.

This same concept applies to Client-First spacing system. For example, by implementing a spacing wrapper concept, we separate *margin-top* and *margin-large* from other elements.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659bf5a7027e35cc63cd5c3b_avoid-deep-stack-3-class-strategy-2.webp)

##### 3. Create a combo class

For example:

*section\_header*+ *is-mobile-reverse* +*background-color-brand* +*text-color-alternate*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659bf5b57dcbf844424506ff_create-combo-class-1-class-strategy-2.webp)

Can turn into:

*section\_header*+*is-home-header*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659bf5cb6deccf20338cff5e_create-combo-class-2-class-strategy-2.webp)

We inherit the important global styles from *section\_header*, for example, padding, z-index, and transition.

Our *is-home-header* class is a combo class, which adds background-color, text color, and responsive layout changes to the instance.

Instead of stacking four classes, we have reduced the stacking to two classes. This is easier to manage and more flexible for updates.

### No layout system

#### No flex, grid, column, or layout classes

No flex, grid, column, or layout classes are included with Client-First.

We do not recommend a fully global managed flex or grid class system inside Webflow. We encourage custom class creation using flex, grid, or any column layout system.

##### Example 1 of what we don't like

Let’s build a grid layout with utility classes. This example is not a practice of Client-First. Instead, it is an example of why we do not have a formal layout system included in Client-First.

*grid-3-col* *gap-large* *tablet-grid-2* *mobile-grid-1*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659bf5e7a242426791b99445_no-layout-system-1-class-strategy-2.webp)

Now imagine the client asks to create less space between the items on tablet. The gap-large that we needed on desktop is no longer needed on tablet. We need a much smaller gap. However, we’re inheriting our gap-large from desktop.

Our class list can get long when adding custom tablet and mobile add-ons to our utility layout system. Tablet and mobile responsiveness variations can result in super deep stacking.

To satisfy every use case of every layout size option across all breakpoints, we need a large and complex layout system. We will have to create a new class to achieve the layout if there's no utility class available for our responsive customization.

Many steps are required to go from a blank Div Block to a finished responsive element.

##### Example 2 of what we don't like

It's possible to reduce the number of classes in a utility class system by grouping multiple CSS properties into one class.

For example, *flex-a-l-j-c* + *flex-mobile-a-c* establishes the flex settings on the base breakpoint and the mobile variation.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659bf60ec10f331d3034c66a_no-layout-system-2-class-strategy-2.webp)

This naming is unclear to someone who doesn't know this layout system. As the original developer, we may know it, but that doesn't mean other developers or our clients will.

We don't want to see *col-2-d* + *col-5-t* + *col-12m* either.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659bf5f60761aae33e30f0bb_no-layout-system-3-class-strategy-2.webp)

Although this convention may be clearer, we still need to understand how this system works. It's unclear what our options are to continue building in the project.

What do the numbers mean? What do the letters mean? What are the columns? How do responsive updates work? What do I do when I need a unique customization?

##### Example of what can work with Client-First

**We can use** the power of global classes to create layouts in Client-First. Global layout systems can be Client-First friendly. If that's what is best for our build, do it.

For example, *grid\_col-2* and *grid\_col-3* can be used as the default 2 and 3 column layouts. On desktop they are all equal. A combo class *is-specific-instance* can be created for tablet and mobile instances that are different from the default.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659bf63786ed88ce24d93e85_can-work-class-strategy-2.webp)

**We do not want** to lock everybody into a deep global class layout system for every layout, section, or page of our build. Using a combo class system like this can be Client-First friendly while maintaining layout unity.

##### Create layouts with custom classes

We can create simple and complex layouts using custom classes. We can use custom classes for all layouts in our projects if we want.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/422945a8315c9d23fe7d67af481fcbb1/manifest/video.m3u8)

Custom classes are excellent for building layouts. Custom classes allow us to:

- Quickly build page structures
- Quickly make edits in the future
- Make all responsive customizations
- Prevent accidental site-wide layout breaking
- Hand off our project with a minimal learning curve

---

<!-- source: https://finsweet.com/client-first/docs/folders -->

CONCEPTS

## Folders

Finsweet introduces a folder system add-on for Client-First. Organize our project's classes with Folders.

### Intro to Folders

> Folders are a virtual organization tool to group and visually manage classes inside our Webflow project.

We can visualize a folder structure for our project's classes inside Webflow Designer by following a simple naming convention. By using the underscore character, we can create a virtual folder system with Client-First.

There are two types of folders: **Custom class folders** and **Utility class folders**.

#### 1. Custom class folders

Use the underscore character to create folders for a project's classes.

Finsweet Extension automatically generates a virtual folder structure inside Designer with this new naming convention.

Folders work like this:

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7aeffe2bbc52ef276bf8_custom-class-folder.webp)

> A custom class is a class created for a specific component, page, grouping of elements, or single element. For example, a class to style the team slider or a class to style the global headers for the project.  
>    
> **Custom classes use an underscore in the class name.**

Here's an example of a Webflow project's classes organized by folder. Selected is the *nav\_primary\_logo-wrapper* class.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7b01ed3a128a912397c9_custom-class-folder-2.webp)

In the example above, we have a first level *nav\_* folder.   
Nested inside is a *primary\_*  folder.   
Nested inside is the element name, the *logo-wrapper*.  
‍  
The full class name to create this folder structure would be *nav\_primary\_logo-wrapper*.  
The underscore folder system is specific to custom classes.

#### 2. Utility class folders

Utility classes in Client-First are automatically organized inside the Utility folder.

Utility class folders work like this:

> A utility class is a class created with a specific combination of CSS properties that can be applied to elements across the project. For example, a class for background-color or a class for font-size.  
> ‍  
> **Utility classes do not use an underscore in the class name.**

Utility classes do not have the same rules as the custom class underscore folder system.

Any class **without** an underscore goes into the "Utility" folder.

Classes with the dash character only are utility classes.

Client-First Folders will automatically group classes in a folder by matching keywords. Below is a screenshot of the Client-First starter project. The classes are organized by keyword.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7b13c489a49f4899e174_utility-class-folders.webp)

### Custom class folders

#### Folder underscores

Custom class folders are indicated by an underscore in the class name.

*folder-one\_element-name*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7b292f57efbcb3baf2a7_folder-underscore-1.webp)

Imagine folders in Client-First like folders on our computer. We give a name to the folder and put items inside. The underscore character is our ultimate folder creation tool for custom classes.

*folder-one\_folder-two\_element-name*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7b3e7f8b7cf2510dbc7c_folder-underscore-2.webp)

In our Webflow project, we can use folders in the same way we use our computer's folders. Folders can have items in them, and folders can be nested in other folders.

###### Folders help us group, search for, and access elements in our project.

A folder can organize a:

- Tiny group of elements on the page
- Small part of a section
- Section
- Group of sections
- Page
- Group of pages
- Recurring element
- "New" part of the website

#### How to group elements

The approach we take to group our elements depends on the project requirements. The specs, the size, and many other factors can influence how we organize our folder structure for that project. Each project is different and should be organized differently.

###### How many pages are in the project?

###### Is the design and layout for each page unique?

###### Are there recurring elements?

The answers to these questions can significantly influence how we organize our project's folders.

Projects are unique like our computers are unique.

Each computer has different files and should be organized based on the files on the computer. A computer with 10,000 files would have a different folder organization than a computer with 100 files.

In our Client-First project, the number of folders and levels of the organization should relate to the number of items we need to put in them.

Folders can be nested to achieve maximum flexibility for folder use.

We may want a well-crafted multi-nested folder structure for larger websites with more organization requirements. We may want more simplified single-level folders for smaller, more custom websites.

There is no limit to how many folders we can have in our class name. The organization rules are our choice as the developer.

##### Nest folders with purpose

Only nest folders if it's meaningful for the project. Don't nest folders just because we can. Many projects can have one folder level without any nested folders.

Over-nesting or nesting with no purpose can make our project challenging to manage.

In our computer files example, having too many folders for a small number of items makes the navigation of our items more difficult. Searching through nested folders can be frustrating if nesting is not needed.

The same concept applies to folders in Client-First. We want to be able to find elements quickly, not search through nests of folders.

#### Creating folders

> One underscore equals one folder

Below we show class names and how those class names translate to folders. We can see the "**home-testimonials**", "**header**", and "**careers**" folders.

##### Creating one folder

*home-testimonials\_wrapper*  
*home-testimonials\_headshot*  
*home-testimonials\_text-small*  
*header-top\_content*  
*header-top\_image*  
*header-top\_accent-left*  
*careers\_custom-padding*  
*careers\_title-animation*  
*careers\_scroll-trigger*

##### Generated folders

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7b55589d4584c919c89e_generated-folders.webp)

The folder's name is generated based on the keyword(s) that comes before the **\_** character.

##### Creating a nested folder

We create a nested folder by adding a second underscore.

> Two underscores equal two folders

Let's continue with the example above. We will convert each class above to a nested folder. Each class now has two underscores.

##### Example of nested second folder level

*home\_testimonials\_wrapper*  
*home\_testimonials\_headshot*  
*home\_testimonials\_text-small*  
*home\_header-top\_content*  
*home\_header-top\_image*  
*home\_header-top\_accent-left*  
*home\_careers\_custom-padding*  
*home\_careers\_title-animation*  
*home\_careers\_scroll-trigger*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7b6746ce1c02888ea38c_second-level.webp)

By adding a second underscore, we are nesting a folder.

Custom class folders can be named, nested, and organized. There are no limits or restrictions for folder organization.

### Utility class folders

> Utility classes are created by **not using an underscore in the class name**. A utility class has dashes only.

*firstkeyword-secondkeyword-identifier*

##### Example utility classes

*text-color-primary*  
‍*text-color-secondary*  
‍*text-color-brand*‍  
‍*text-size-small*  
‍*text-size-medium*  
‍*text-size-large*  
‍*padding-top*‍  
‍*padding-large*  
‍*page-wrapper*  
‍*page-padding*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7b79dfa99d9cee7c9d30_example-utility.webp)

#### Creating utility folders

A folder is created with matching keywords in the class name. Utility folders can create as many levels of nested folders as possible.

##### Matching keywords by index

The word **index** in this context means "The position/order of a keyword in a text string".

Finsweet Extension looks for matching keywords by index (position) and organizes classes inside the Utility folder. We will look at an example of keywords by index using *text-color-primary*.

*firstword-secondword-thirdword* = *text-color-primary*

In the above example,

- ‍*text* = *firstword*
- *color* = *secondword*
- *primary* = *thirdword*

We always create a folder from **firstword**. The "**text**" folder will be created regardless of other class namings in the project.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7b8aabd99e2054feb6ac_matching-keywords.webp)

If at least one other class shares both "**text**" as the **firstword** and "**color**" as the **secondword**, create a folder called "**color**" inside "**text"**.

When we find two classes in the project that start with *text-color-*, we create the "**color**" folder.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7b9de055ccf13e197a9a_matching-keywords-2.webp)

We can add any amount of classes inside the color folder by continuing with our *text-color-* naming convention.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7baf9412465c8a599fa1_matching-keywords-3.webp)

##### **No matching keywords at secondword**

If there is no matching keyword as the **secondword**, a class will remain in its parent folder. We will understand this through an example.

If we have a class *text-indent-large* and no other class in the project that starts with *text-indent-*, this class will be placed in the "**text**" folder.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7bc8589d4584c919f7e6_no-matching.webp)

An "**indent**" folder is not created because there is only one class with "**text**" at **firstword** and "**indent**" at **secondword**. There are no other "**indent**" classes.

Once we add a matching class, for example, *text-indent-small*, a new folder will be created.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7bdcfaadfb8ed921fc75_matching-keywords-2-1.webp)

##### No matching keywords at firstword

Above we explained, "We always create the first folder from **firstword**". We will always create the first folder based on the **firstword**, regardless of other class names in the project.

If a class has a unique **firstword**, and this **firstword** doesn't exist anywhere in the project, we create a folder for **firstword**, and this class is the only class in the folder.

For example, we have a class in our project called *filter-blur-extend*. If there is no other class in our project with the word "**filter**" at **firstword**, we will see a "**filter**" folder with **blur-extended** as the identifier of the class name.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7bef21eecb2ee0ecc281_matching-keywords-3-1.webp)

#### Scaling utility folders

Client-First starter project comes with an organized folder system of utility classes. We can add, remove, or edit these classes based on our project.

Adding and removing folders from the Utility folder is recommended for each Webflow project.

We can continue to add or remove nested folders by using matching keywords. Create a match at **firstword** and **secondword** to create new utility folders.

For example, a class grouping to style box-shadow:

*shadow-box-large*  
*shadow-box-medium*  
*shadow-box-small*  
*shadow-circle-large*  
*shadow-circle-medium*  
*shadow-circle-small*  
*shadow-blur-x*  
*shadow-blur-y*

With these classes, we have just created a *shadow* folder with three nested folders inside — *box*, *circle*, and *blur*.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7c10e055ccf13e19adbc_scaling-utility-folders.webp)

### Folders decision making tree

There are many decisions to be made when organizing our project's classes.

Some decisions should be made before we start developing. Many decisions can be made as we are developing.

It may be time-consuming when we start making organizational decisions in our Webflow project. Making fast and intelligent decisions come with practice.

Understand that making decisions for folder names is something we will improve on as we continue using Client-First. Our speed and accuracy will improve as we continue to use the Folders feature in our projects.

##### Visualization of decisions

We have developed a decision making tree to help us understand how to make quick decisions about class organization.

[View a PDF of our Folders decision making tree](https://cdn.prod.website-files.com/60f51550d69dbad0b4e158eb/630ddb9f8d845aec043c0aed_Client-First%20Folder%20Decision%20Tree.pdf). This model shows the thought process of giving a name to a folder.

Questions asked in the decision making tree are below:

###### **Is this class used to create a specific CSS style that can be used on any element? For example, *text-size-large*.**

Use Utility Class folders. It's best practice to continue with the utility classes that come with the Client-First cloneable.

For example: *page-*, *heading-*, *text-*, *icon-*, etc.

If the utility styling is not included with the Client-First cloneable, create a new utility folder.

For example: *shadow-small*, *shadow-medium*, *shadow-large*‍

‍

###### **Is the element specific to this page?**

It may be a good strategy to add the page name to the class name.

For example:

1. *[page]-slider\_pane*  
2. *[page] \_slider-pane*  
3. *slider\_ [page]-pane*

‍

###### **Is this element part of a specific component? For example, a clients slider.**

It may be a good strategy to use the specific keyword in the class name.

For example:

1. *slider-clients\_pane*  
2. *slider \_clients-pane*

‍

###### **Is this element part of a general component that can be used anywhere in the project? For example, a slider that can be used for multiple content use cases.**

It may be a good strategy to keep the folder name general.

For example:

1. *slider\_pane*

### Workflow enhancements

#### Folder rename (Bulk class rename)

Rename every class inside a folder in one bulk process.

For example, if we rename the *testimonials\_* folder to *clients\_*, we will rename every class inside the folder with the update.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7c32ed3a128a91243358_folder-rename.webp)

This is an opportunity to organize our project at any stage of development. We can change the naming convention of hundreds of classes within minutes.

Using [Relume Library](https://finsweet.info/relume), we can copy template-named components to our project and bulk rename them for our use case.

#### Class/Folder data and page influence

Open class the details to understand how this folder or class is affected in the build.

We have the same information that is shown natively inside Webflow Designer's Style Manager panel.

View "Elements affected on this page" and "Elements affected on other pages".

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7c43094eaac10ead746f_class-folder.webp)

Access this information at the folder level or at the element identifier level.

This feature gives us a deeper look into our project's folders and how they are used throughout the project.

#### Copy class name to clipboard

Copy-to-clipboard the name of any class.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7c57abd99e2054ff29aa_copy-class.webp)

We can copy any part of the class name based on where we open the class details.

For example, we can copy the folder name by accessing the class information from the folder level.

We can copy the entire class name by accessing the class information from the element identifier level.

---

<!-- source: https://finsweet.com/client-first/docs/folders-strategy -->

CONCEPTS

## Folders strategy

Next step in Client-First Folders. Explore use cases and strategies around Folders.

### Intro

Most of this article is about the strategies we can take to use custom class folders.

Projects are different.

- Projects have different requirements.
- Projects vary in design and layout style
- Projects may have different post-project maintenance strategies.

These factors can go into our folder naming strategy for the project.

Folders was built to offer flexibility in how we name and organize classes. Remember that Client-First is "One naming convention for every project." We mean it when we say it. For this to be true, we need flexibility in our folder organization system.

###### There is often no right or wrong to class naming. There is only more and less efficient.

High efficiency in Webflow is achieved when our build strategy is customized for the project we are developing.

##### Examples below

Below we show many different naming strategies with different folder organization styles.

It's important to understand that we should not use all of the strategies in a single project. We can use multiple strategies, but not all strategies.

There should be unification of naming conventions when we implement our folder system. Much like the files on our computer, it's best if we have a planned structure that unifies the organization of the files.

We recommend having a plan for the folder naming convention before we start developing.

Let's review each example and explain when we may want to use it.

### Types of folder organization

#### One folder

##### One folder level, general folder name

Helpful in creating components that are not specific to any page or content.

When naming is general, it is clearer that the folder is used globally throughout the project.

General naming is great for recurring core elements in the project.

*one-folder\_name-of-element*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7e0d8861b35ea6c7e8da_one-folder-general.webp)

##### One folder level, specific folder name

Helpful in creating any type of custom folder, regardless of project size.

Add the page name to give context to its relation to the page.

Add content-specific keywords to provide more information about the purpose of the class.

Specific naming works well for smaller custom websites that don't require much global organization.

Specific naming is ideal for sections, components, and elements created for a certain page or instance.

*one-specific-folder\_name-of-element*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7e1be70ccba2b8dcef84_one-folder-specific.webp)

##### One folder level, page name as folder name

Helpful in creating a folder of classes specific to an identifiable page.

If we are creating a new page, and that page has custom components different from the rest of the site, we can organize these components inside a single page folder.

A page folder is a good strategy when there aren't many custom classes for the page, and the custom classes are created for the page they are named after.

*page-folder\_name-of-element*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7e2af6c98b40e86261cf_one-folder-page.webp)

###### Important: Do not use page name folder organization and reuse the class on other pages. This will lead to an unorganized and confusing class system. Instead, if we use a class across multiple pages, use the "One folder level, specific folder name" strategy. When using the page name strategy, we must only use the class on that page.

‍

##### One folder level, page name as element prefix

Helpful in creating unique variations of a component by page while still staying in the folder structure for the component.

For example, every slider in the project has the same styles applied to it. The homepage has a unique variation of the arrow UI. This variation is not enough to call the component a unique slider or to create an entirely different folder specifically for this variation. It is styled like the rest of the sliders, with a few exceptions.

We want to continue to manage all slider components inside the *slider\_* folder.

We can use a page prefix as the first keyword of the element identifier to identify the purpose of the new class in the *slider\_*folder.

We identify the homepage instance without creating a new folder for our slider component.

*one-folder\_page-name-element*  
*slider\_culture-pane*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7e3d1c8bcc13b968d1f7_one-folder-prefix.webp)

Can't we use a combo class for this? *slider\_pane* *is-culture*

Yes, a combo class can be used instead of this strategy. A combo class may be the right decision.

There may be a reason why we do not want to use a combo class implementation for this variation. For example, we do not need to inherit the styles from *slider\_pane*. More information about intelligent combo class use in [Classes strategy 2.](https://finsweet.com/client-first/docs/classes-strategy-2)

#### Nested folders

Helpful in larger sites with more complex organization requirements.

Using two folder levels, or nested folders, does not have to be a site-wide strategy for every element.

We can use nested folders in a few folders. We can use them for one specific use case.

###### Just because we have the power of nested folders doesn't mean we should always use them. Only nest folders when there is a clear organizational win.

##### Nested folders, page folder first

Helpful in identifying a collection of components by page name first.

If the components on each page are unique, and we want to find them based on their page, this strategy can help us.

If we see our website's pages as the best way to organize components, this strategy can help us.

‍*page-folder\_keyword-folder\_name-of-element*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7e4b359714d42a12ae63_nested-folders-page.webp)

##### Nested folders, keyword folder first

Helpful in identifying a component by keyword first, then by page name.

If the same component category has unique variations on many different pages, we may want to use the component as the base organization.

When navigating to the component's folder, we can view all of the pages where component has unique instances.

*keyword-folder\_page-folder\_name-of-element*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7e6e5243ed5b2cc764f8_nested-folders-keywords.webp)

##### Nested folders, any organization

We thrive on flexibility.

Above we see clear use cases, but it's a fact that not every naming decision is clear. Sometimes we can fit perfectly into one of the above strategies. Sometimes we need to do something different to accommodate our use case.

We can use folders for anything. There are no strict rules when it comes to custom class naming conventions.

Any organization is accepted as long as it's clear what the organization strategy is accomplishing.

‍*anything\_anything\_name-of-element*

### Page name in class name

The decision to add a page name to a class name is powerful. Below we will go through questions to ask ourselves with each project.

We can give more clarity and context to our components by adding the page's name. We can tell ourselves, and the next developer, that **this class is specific to a page**.

We can give equally as much context bynot using the page name for our components. We can tell ourselves, and the next developer, that **this class is not specific to a page and can be used globally on any page**.

##### Flexible options using page name

- Page names can go in the folder name.
- Page names can go in the element identifier.
- Keywords can be mixed with page names in both the folder name and identifier.

With this flexibility, we can organize our projects based on our needs.

Remember that adding the page name is our decision. Our ultimate end goal is to create a project that makes our job easier and allows the following user to edit the Webflow project effectively. If the context of the page name will help us use the project better, then add the page name.

To make better decisions for page name use, we can ask ourselves these questions:**‍**

##### Is this element styled for this page only?

If a class is created for a particular page, it may be best to use that page name in the class name.

The class has a specific purpose of doing [something] to an element on that particular page.

Adding the page name gives context to the purpose of this class.

Here we show three examples of page names in the class name. Each example has two naming options — one folder level and two folder levels.

*page-component\_element-name* or *page\_component\_element-name*

‍

‍**‍**1. *home-slider\_arrow* or *home\_slider\_arrow*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7e86458eb201f132f778_page-example-1.webp)

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7e96094eaac10eae961b_page-example-2.webp)

‍**‍**

**‍**2. *team-slider\_arrow* or *team\_slider\_arrow*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7eab046a0c4cb51b8d22_page-example-3.webp)

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7ebab585c53b9b4188ec_page-example-4.webp)

‍

‍

‍**‍**3. *portfolio-slider\_arrow* or *portfolio\_slider\_arrow*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7eceb5b63478cc41eaed_page-example-5.webp)

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7ed84361f0f1382e86e0_page-example-6.webp)

‍

With the page name in the class name, we can assume that this class is specific to this page. It will not conflict with other pages. We can edit the class knowing we are editing this specific page instance.

##### Is this a reusable element throughout the project?

If reusing components and elements across the project is required for our build, it may be best not to use the page name in these class names.

We may be best using the keyword as the base level folder name.

We don't want to define our components as specific to a page if the component is not specific to a page.

If the class is meant to be used elsewhere in the project, or has the potential to be used elsewhere in the project, it may not be best to use the page name.

Here we show several examples of reusable elements that are not specific to a page. Their naming is general enough to make it clear they are reusable.

*specific-topic\_element-name*

‍  
*slider\_arrow*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7ef0faadfb8ed9238cab_reusable-elements-1.webp)

‍  
*header\_image-right*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7efbb26b3fb0ceead196_reusable-elements-2.webp)

‍  
*subscribe\_form-input*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7f09e70ccba2b8dd5533_reusable-elements-3.webp)

‍  
*clients-logos\_row*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7f1a524adf76bf3bee2e_reusable-elements-4.webp)

When naming is very general, with no page name present, we can make better assumptions as a new developer entering the project.

The class *slider\_arrow* is very general and can likely be used on all or most sliders. With the Styles panel stats, we can see this used 2 times on this page and on 4 other pages. We have enough information to assume this is a reusable element in our project.

If we were building a new page in the project, we would be comfortable using this class without renaming it. We would also be sure not to accidentally edit other instances with styles unique to the new page.

Class naming with a general keyword gives context to this class's impact on the project.

##### When to use page name (or specific keyword) as the element prefix?

Let's continue with the example in the previous section. We have our *slider\_* folder that is intended for use across our project.

Imagine there is a variation of the slider on the testimonials page instance. The testimonials page testimonial has a different arrow visual. It is a variation that is unique from the default *slider\_arrow*. Everything about it is different.

This testimonials slider shares all of the core styles of the slider component, except for the arrows. Since it is such a minor variation from the entire component, it does not make sense to rename everything as the *testimonials-slider\_ component*. We still want to use our default slider styles to stay consistent across the project.

The variation is not significant enough to create a unique component or a new folder. We only need custom arrows for the testimonials page.

We can use combo classes or a new custom class with the page name as the element prefix.

First, we will show the custom class approach.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7f2872733929624216f0_prefix-example.webp)

This shows the slider component with two testimonial-specific classes. We are not creating a unique folder. We are further specifying the element inside the *slider\_* folder.

Both *slider\_testimonials-arrow* and *slider\_testimonials-arrow-trigger* use the word **testimonials** as the first keyword of the element name.

The "testimonials" keyword tells us the slider element is specific to a testimonials instance.

##### Unclear if something is a page name or keyword name

###### Page names can be mistaken for keyword names — or keyword names be mistaken for page names.

We may not always have 100% clarity on a page name vs. a keyword name. However, the principles of naming still help us maintain an organizational strategy.

For example, *testimonials\_slider* use "testimonials" as a keyword or page name.

We may have a client page with a testimonials slider.

We may have a testimonials page with a slider.

This class may exist on many pages and represent the slider that holds many types of testimonials.

We, as the project developer, may know what *testimonials\_* mean. However, others viewing the site after us may not have complete clarity.

There is no magic fix to identifying the keyword and what it means for every class. It is challenging to make every class in our project 100% clear, regardless of the naming convention we use.

However, we want to reach the as much clarity as possible. This is why we have the Client-First system in place.

Sometimes there are naming conflicts, and that's ok.

###### As long as we create names that give the most context into the class, we are following Client-First and providing a powerful level of organization to our project.

### One folder vs. two folders

We must use Client-First Folders with purpose.

Just because we can nest folders doesn't mean we should always nest folders. The size of our project and the level of organization required should be the two core factors in the decision for levels of folder nesting.

If our *testimonials\_* folder has 100 different items across different instances, it may make sense to use a nested folder to organize these classes further. It may be beneficial to have an additional "layer" of organization for those 100 different items.

If our *clients\_* folder has 12 items, it may not make sense to have a nested folder. Do we need to organize the 12 items further? Maybe, but likely not.

The decision to use one or two folder levels for our project is entirely up to us.

Understand that we can have parts of our project that use one folder level and other parts that use two folder levels. We can customize the amount of folders in any way that we want.

##### Example using computer analogy

Let's look at an example using the computer folder analogy.

**Example:** We have an excel file with all our university test scores. We need to organize this file on our computer.

> We have base level folders "Personal", "School", "Side-hustle", and "Work".

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7f405243ed5b2cc7cb9a_computer-analogy-1.png)

>> Inside the "School" folder we have "Masters Degree" "Primary", "University".

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7f4f62d6ada43492a9ac_computer-analogy-2.png)

>>> Inside the "University" folder we see our file "university-test-scores.xls".

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7f5cb585c53b9b41d7fc_computer-analogy-3.png)

This is a folder structure that makes sense for a lot of personal computers. Different parts of our life get a different base level folder.

Inside our "School" folder, there are hundreds of files inside each of the "Primary", "University" and "Master's Degree" folders.

Trying to group all of the files into one single folder called "School" may not be organized.

If we wanted to find files specific to "University" it would be difficult if all three schooling levels were in the same folder.

Finding one file out of hundreds of files would be difficult. Creating the second level of folders gives us a deeper organization that works well in this use case.

Now imagine a personal computer of a young primary school student. They don't have work or a side-hustle. They only have "School" and "Personal".

There are fewer files on the primary school student's computer than on the master's degree student who has been using their computer since primary school.

For our young high school student:

> We have base level folders "School" and "Personal"

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7f6b80468e6edfcf501d_computer-analogy-4.png)

>> Inside "School", we have 12 files. The student doesn't have many files for school. We can easily find our file "geography-test-scores.xls" among those 12 files.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7f789412465c8a5ba190_computer-analogy-5.webp)

If we followed the master's student folder structure for these 12 files, finding the file might be more challenging.

More clicks and more thinking about how the files are organized. If we don't need a nested folder to create further organization, we should not use a nested folder.

Nested folders should help us work quicker, not slower.

### Component libraries

Component libraries, like Relume Library, may benefit from nested folders — or maybe many nested folders.

Folders introduce a massive organizational upgrade to component libraries of all sizes. We will show an example of this with a component library use case.

In a component library, we may want to organize classes like this:

*slider1\_component*  
*slider2\_component*  
*slider3\_component*  
*grid1\_component*  
*grid7\_component*  
*logo-row1\_component*  
*logo-row2\_component*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7f85524adf76bf3c1afb_components-library-1.webp)

There's no proper way to name components in a component library to be instance-specific.

A component library intends to create reusable components that can be used anywhere in our project.

If a component library has 100 components, we would see 100 folders in our virtual folder system. This list may not be very easy to navigate.

Adding one underscore can better organize our components to handle variations and options.

The same classes have been re-written to include a nested folder with the variation number.

*slider\_1\_component*  
*slider\_2\_component*  
*slider\_3\_component*  
*grid\_1\_component*  
*grid\_7\_component*  
*logo-row\_1\_component*  
*logo-row\_2\_component*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7f8fa5a2f97fb6ea72e3_components-library-2.webp)

Look at the beautiful output this naming convention gives.

We can organize all of our component types as base level folders. As we click into each folder, we see how many option variations are available. Each variation is clearly defined and organized in its folder.

For extra super large component libraries with many variations, it may be smart to use three folder levels — nested nested folders.

#### Power renaming with Finsweet Extension

Once the component is in our primary project, we can rename the entire folder with [Finsweet Extension](https://www.finsweet.com/extension/).

Using Finsweet Extension, we can bulk rename any folder name.

This means we can copy*layouts\_grid\_1\_* into our project and bulk rename every element in this folder as *team-grid\_*. This bulk folder renaming takes seconds inside the extension.

More information about Finsweet Extension capabilities on the [Folders](https://finsweet.com/client-first/docs/folders) page.

### Using the component keyword

The initial V1 release of Client-First defined components as this:

Components in Client-First are a group of page elements that create a complete UI element. For example, a newsletter signup, team grid, pricing calculator, reusable 3 column grid, or a clients list.

Components in Client-First have always been defined as using an underscore in the class name.

All of this is still true. In this folders update, we will be more specific when we are using components — and more precise when using underscores!

> **V1 Initial release  
> ‍**underscore in class name = component

> **V2 release with Folders  
> ‍**underscore in class name = folder   
> [folder-name]\_component = component

Using a folder underscore in the class name does not necessarily mean the folder is a component. We now use underscores for organization or groupings of elements in Folders.

Components now have a specific classification. If we want an element to be a component, we use the word **"component"** for the element identifier.

###### Using the component keyword tells us that this folder represents a component — a group of page elements that create a complete UI element.

We can think of components as a complete structure that we can copy-paste. We copy the entire structure from the *\_component* class.

For example, we may have a clients slider on our website. We consider this clients slider a component. On the parent wrapper of all elements of the clients slider, we would add our component keyword.

*client-slider\_component*  
*client-slider\_mask*  
*client-slider\_grid*  
*client-slider\_arrow*

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b7fa121eecb2ee0ee8acb_components-library-3.webp)

This tells us that the *clients-slider\_* folder is a component.

Not everything needs to be a component. Structures like newsletter signup, team grid, pricing calculator, or clients list are all great examples of components.

Sometimes we will want to use folders for groupings other than components.

For example, a style guide folder. If our Webflow project uses a style guide, we will likely need to create classes for the style guide. The style guide classes may be on one page. The classes may be used across several pages.

To organize our style guide classes, we can put the classes in a folder specifically for organizational purposes.

*styleguide\_structure*  
*styleguide\_content*  
*styleguide\_item*  
*styleguide\_sidebar*

Our style guide page is not a component. It's simply an organization of elements.

Adding the *\_component* keyword is always optional. As developers, we decide to add a component 'tag' as the element identifier of the class name.

### Folder decision making tree

There are many decisions to be made when we are organizing our project.

Some of the decisions can be made before we start developing.

Many decisions will be made as we are developing.

It may be time-consuming when we first start making folder naming decisions. Making rapid and intelligent naming decisions comes with practice.

Understand that making naming decisions for folders is something we will improve on as we continue using Client-First.

Our speed and accuracy will improve as we continue to use the Folders feature in our projects.

We have developed a decision making tree to help us understand how to make quick decisions about class organization.

[View the Folders decision PDF](https://cdn.prod.website-files.com/60f51550d69dbad0b4e158eb/630ddb9f8d845aec043c0aed_Client-First%20Folder%20Decision%20Tree.pdf).

It may have taken a few minutes to read this graphic. We will not need a few minutes to make decisions with each name. As we continue to apply this logic to our class naming decisions, we will make these decisions faster.

We can quickly make these complex decisions with practice, trial, and error.

Is there a question that was not answered in the docs? [Let us know on Twitter](https://twitter.com/thatsfinsweet).

---

<!-- source: https://finsweet.com/client-first/docs/interactions-naming -->

CONCEPTS

## Interactions naming

A naming convention for Webflow Interactions.

### Naming convention

This page explains how we can approach naming Webflow Interactions to stay organized in our project.

#### Element [Action + State]

> **Element** is the section/div/button/etc. that we apply the interaction to.

> **Action** describes the interaction. Add **State** if valuable for context.

For example,

- Element = **Sort Button Arrow**
- Action = **Rotate**
- State = **Open**

Full interaction name:

> **Sort Button Arrow [Rotate Open]**

#### Maximum context

The **Element** and **Action** phrases should give as much context to the purpose of this interaction in the project.

When creating our interactions name, we should answer the question, "What is this interaction?"

A new developer entering the build should know about what this interaction is doing in the project. Use powerful keywords to describe the interaction.

#### Minimal words

We always want to keep descriptions minimal. Short is good. We want to give the most information in the least amount of words.

Ideally, our interaction names never overflow past Designer's Interactions UI panel.

If our names continuously overflow the UI panel, we're likely being too descriptive in our interaction naming.

We use capital letters for the first character of each word to improve scan-ability of the Interaction name.

#### Square brackets

Separate the **Action** and **State** keywords from the **Element** keywords by using square brackets around **Action** and **State**.

This visually separates both parts of the interaction name.

### Examples

#### Examples using general naming

With general naming like 'button' or 'image', we imply the interactions are used as universal interactions.

> **Button Arrow [Move In]**  
> The default button arrow moves in. "in" is the state of the move Action.  
>   
> **Button Arrow [Move Out]**  
> The primary button effect "out" state moves the arrow to the original position.

> **Image [Show Scroll In]**  
> Image appears when the user scrolls into the section.  
>   
> **Image [Hide Scroll Out]**  
> Image hides when the user scrolls out of the section.

> **Nav Menu [Open]**  
> The primary nav menu open interaction.  
>   
> **Nav Menu [Close]**  
> The primary nav menu close interaction.

#### Examples using specific naming

With specific naming, we can clarify what unique interactions are doing for specific elements. Through naming, we imply the interactions are used as specific use cases.

> **Home Hero Lottie [Show]**  
> Show and play Lottie explosion on the home hero section.  
>   
> **Home Hero Lottie [Hide]**  
> Hides and resets the Lottie explosion animation on the home hero section.

> **Jobs Item Modal [Open]**  
> Open apply modal, which is triggered by a jobs item.  
>   
> **Jobs Item Modal [Close]**  
> Close apply modal, which is triggered by a jobs item.

> **Contact Form Input [Height Increase]**  
> Increase the height of the contact form input.  
>   
> **Contact Form Input [Height Decrease]**  
> Decrease the height of the contact form input.

### Keywords

#### Action keywords

Use keywords that best describe the action that occurs when the interaction runs.

Use the least amount of words to give the most context about the interaction's purpose.

##### Popular action keywords

- Show
- Hide
- Move
- Rotate
- Scale

#### State keywords

Add state keywords to communicate a toggling state of a an interaction sequence.

##### Popular state keywords

- In / Out
- Open / Close
- Increase / Decrease
- Expand / Collapse

#### Action and State can mix

We do not need to strictly follow **[Action + state]**. We can be flexible with our keywords inside the brackets.

It is possible that Action and State keywords are used together **Element [Action + State]**.

It is possible they are used individually **Element [Action]** or **Element [State]**.

It is possible that a State keyword alone is better than Action + State. For example, "**Jobs Item Modal [Open]**".

It is possible that "Show" and "Hide" is seen as an Action or a State (Visible / Hidden). "**Jobs Item Modal [Show]**".

Don't spend a lot of time thinking about Action + State. Pick something that is clear and continue working.

**Our goal:** Action and State keywords should be arranged inside the brackets to give the user the maximum amount of context into the interaction's purpose.

#### Trigger keywords

If we need to add more information to our interaction name, we can use keywords to help us understand the trigger.

##### Trigger keyword examples

- Click
- Hover
- Mouse Move
- Scroll
- While Scrolling
- Load

**We must add trigger keywords carefully.**

##### Optionally add trigger keywords

Adding trigger keywords in the interaction name is technically inaccurate based on how Webflow Interactions are configured.

Webflow interactions do not include triggers in the action steps. Therefore Webflow interactions can run with different triggers.

If we include the trigger in the name of the interaction, then the interaction can not be shared by different triggers.

For example, an interaction is created to "open" a dropdown nav item inside the nav component. A mega menu.

- On desktop, the interaction runs with a "hover" trigger.
- On mobile, the interaction runs with a "click" trigger.
- The same interaction is used for both devices. The element trigger, as well as the trigger type, is different based on device.
- This is a clear example of a trigger not belonging to an interaction. Triggers are separate.
- Using the name "**Nav Dropdown [Open Hover In]**" is inaccurate since it is triggered differently on mobile.
- Using the name "**Nav Dropdown [Open]**" accurately describes the interaction configuration. The interaction opens the dropdown. This is what the configuration does.

##### Using trigger keywords

If adding the trigger keyword greatly enhances the interaction context, we may want to add the keyword.

Even if a trigger is not included in the interaction configuration, there are instances where a trigger can give important context.

> **Discount Modal [Delay On Load]**

We use the word "delay" and "load" in this name, which tells us important information about the action of this modal. If the purpose of this interaction is to "delay on load", these keywords create clarity.

> **Blank Div [Open Modal With JS Click]**

This Div Block is used as a click trigger to initiate a Webflow Interaction with JavaScript. The interaction was created specifically to listen for a click from JavaScript. After the JS click, the Webflow Interaction runs. Adding the "click" trigger keyword to this name helps communicate that.

#### Responsive keywords

When an interaction is created specifically for a certain breakpoint, responsive level, or device type, we can add that keyword at the end of the interaction name.

> **Nav Sidebar Slide [Show] [Mobile]**  
> Show the nav sidebar on mobile only

> **Hero Scroll Trigger Div [In] [Tablet Mobile]**  
> Show the nav sidebar

> **Background Textures [Hover In] [Desktop]**  
> We only have to specific desktop if it's for Desktop only and turned off for tablet and mobile.

‍

### Conflicts

If you're in a conflict with naming, don't overthink it.

Just make a decision and move forward.

The decision to give a good name to an element, action, state, or trigger is not always clear. That's ok. Pick something and move on.

Taking any significant time to think about a naming is not advised. Breaking your workflow to overthink naming is not advised.

Happy interacting.

---

<!-- source: https://finsweet.com/client-first/docs/variables -->

CONCEPTS

## Variables

Color variables in Webflow and how Client-First uses them — Strategies, naming conventions, and practical usage tips.

#### Disclaimer

###### **⚠️ We decided to not release size variables because there is no breakpoint feature on the variables panel.** When Webflow releases breakpoints, we will revisit the variables panel. For now, we're starting with the clear benefit of variables — Colors.

### What are the benefits of using color variables in your website?

#### **Consistency across the project**

Color variables help unify colors throughout a project. By defining a color once and using it in multiple places, we maintain a consistent look and feel, which is crucial for brand identity and user experience.

When we need to choose a color, color variables give us a list of available options to choose from.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/658326525c14d50b41592be5_screenshot.png)

‍

#### **Ease of maintenance**

If we need to change a color, we only have to update it in one place — The Variables panel. Updating a color variable will change that color everywhere in the project. This makes maintenance and updates much more straightforward. It also reduces errors.

In case we need to update the brand color across the entire project, this can be quickly accomplished by adjusting the value of the primitive tokens:

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/befd7518a4655022e53a29bf1905cb72/manifest/video.m3u8)

‍

‍

By using variables, we can also quickly update colors in different custom components and utility classes at the same time:

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/6b044e1659a862887fcbfa56926dc10e/manifest/video.m3u8)

‍

#### Theming\*

\*This is a starting point for future releases of Webflow Variables.

Using color variables will simplify the creation of different themes, including dark/light modes when Webflow releases modes. By changing the set of color variables, we can easily switch between themes, allowing for more dynamic and customizable designs.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/65834382a5aa7ce4474d5fed_variable-modes.png)

‍

#### **Improved readability and organization**

Using color variables makes our Webflow project more readable and organized. It's much easier to understand and remember a color variable like --primary-color than to remember specific color codes like #FF5733.

‍

#### Context for usage

Organized semantic tokens help us understand which color to use during the building process. The name of the variables gives us a lot of information about **how** it's used in the project.

If we need to add a text color to a heading, we can quickly find the project's text colors in the 'Text Color' variables section.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/8a0f359e44fdd48ed6aefa4f2e4b5127/manifest/video.m3u8)

### Primitive tokens

Primitive tokens, represented by base colors, are the foundational building blocks of a design system's color palette. These variables are the most granular level of color classification. They serve as the base for more complex and specific design decisions.

They are identified by the prefix **- Base Color:**

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/65835068664720bce65f4665_primitive-tokens.png)

‍**‍**

#### **How to use primitives**

In practical terms, these variables are used to create the semantic variables that will be implemented in our project.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/f2e1a50de859078220e1eddcd31f9a0a/manifest/video.m3u8)

###### ⚠️  Avoid directly linking primitive colors to classes unless there is a strong reason to do so.

‍

It’s only recommended to link a style directly with a primitive if you don't plan to use that primitive anywhere else.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/0504f35131139a97df40953a4b0cb54a/manifest/video.m3u8)

‍

#### How to group the primitives

In the Client-First cloneable, we start with the following groups for the primitives:

- Brand colors
- Neutral colors
- System colors

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/65847fda01b6aa3bb527f409_cloneable-grouping.png)

‍

Every project is different. Client-First offers flexibility in grouping, allowing you to rename and regroup the variables based on the project. In the example below, find additional examples of how to group primitives.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/658420cd00b22da5769d2f00_primitive-grouping.png)

‍

#### How to name the primitives

The way designers or companies name primitives can vary significantly. We have chosen to begin our style guide with the names of the colors, accompanied by a small number of shades, as shown below:

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/658421a4d47361ebec62f2f3_client-first-primitives.png)

‍

If this does not fit well with your project, here are some additional examples of how you can name your primitive tokens:

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/65835c124f3b776edd8c41d3_primitive-naming.png)

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/65835d81ccb16c13c98faca6_primitive-naming-large-1.png)

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/65835de6dc859bfdaa52a83a_primitive-naming-large-2.png)

### Semantic tokens

Semantic tokens are variables where the names describes the purpose or meaning of the color within the design rather than describing the color itself. Reading the name of a semantic token will give us a clear understanding of what that token is used for.

In Client-First, all variables that do not contain the prefix **- Base Color**, are semantic tokens.

#### How to use semantic tokens

The semantic tokens are the color variables that we use to style the elements of our website according to its use.

In the examples below, we can see specific use cases where these tokens should be used.

For background color, use the Background Color semantic tokens:

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/4d07eb28ce3a3b6e7126f937ea745da5/manifest/video.m3u8)

‍

For text color, use the Text Color semantic tokens:

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/e33eca0280dc20771ea67198171f8a3e/manifest/video.m3u8)

‍

For border color, use the Border Color semantic tokens:

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/6ae42e3cdb42f555def1b585b0bb6f39/manifest/video.m3u8)

‍

‍

##### Use semantic tokens as utility classes

Every semantic token created in the project can be used as a utility class if desired. This approach allows for quick changes to certain elements. In our style guide, we begin with the following utility classes linked to the semantic tokens:

- ‍*background-color-primary* linked with var(background-color--background-primary
- *background-color-secondary* linked with var(background-color--background-secondary)‍
- *background-color-tertiary* linked with var(background-color--background-tertiary)‍
- *background-color-alternate* linked with var(background-color--background-alternate)‍
- *text-color-primary* linked with var(text-color--text-primary)
- *text-color-secondary* linked with var(text-color--text-secondary)‍
- *text-color-alternate* linked with var(text--text-alternate)

‍

##### If possible, avoid linking a text element base tag directly to the semantic variable

When we apply a color directly to a text element, we lose the ability to inherit the color from the parent element. This approach is very common when developers want to quickly change the color of all child elements at once.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/02a38bf1982864fa56b6dcc24a4eb4f0/manifest/video.m3u8)

‍

If we need to link a semantic token to a text element, Client-First includes a *inherit-color* utility class to override the style and inherit from the parent element. See the example below:

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/383c272f0ca0757f855fca5861bc2203/manifest/video.m3u8)

‍

#### How to name semantic tokens

We suggest naming the semantic tokens with the following naming convention:

##### ‍**[element]** - **[style]** - **[identifier]**

background - color - dark

text - color - primary

border - color - brand

##### Questions to ask ourselves when naming semantic tokens

- **Element:**What is it being added to?
- **Style:** What is the value/style that is changing?
- **Identifier:** What is a identifier for this variable?  
  ‍

Below, you can see a list of semantic token examples that you can use in your project:

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/65847b6264eb269b53790ec9_semantic-backgrounds.png)

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/65847d3c11be89bf77afc22a_semantic-texts.png)

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/65847f2b9f9db6b72d4cbb96_semantic-borders.png)

Similar to primitive tokens, designers and companies have different approaches for naming. Choose names and conventions that are most clear for the project.

‍

##### Do not name a semantic variable with the name of the color

If we name a variable simply by its color, any change in color schemes or themes would require renaming the token. This defeats the purpose of semantic tokens, which is to abstract the design from specific color values. This allows us to manage theming and global changes without renaming variables.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/6584527ad42229edfb2f4b7d_semantic-color.png)

##### The naming convention is important for theming in the future

The names of the variables should be generic enough to accommodate different values for themes, such as light or dark mode. In the example below, see how it should look:

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/658453a6df37fcb376953566_semantic-token-right.png)

‍

If the name of the color is included in the variable, the naming convention will not be compatible with the other color names used in different modes:

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/658453d726ba8bc52ac25f60_semantic-token-wrong.png)

‍

##### Primary and alternate concept

When naming variables, consider setting the default 'theme' of your website as a reference point.

For instance, if the background primary variable represents the color black, you could use background alternate to represent the color white, the inverse of black.

This approach can also be applied to Text Color variables. For example, text primary might represent the color white while text alternate might represent the color black, offering a clear contrast for use on white backgrounds.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/6584774969d5777638a739e7_alternate-concept.png)

### FAQ

#### [fs-toc-omit]Should I follow my client's color system and naming conventions?

Absolutely. If your client has an established style guide, it's best to adhere to their color system and naming conventions. This ensures consistency and aligns with their established branding standards.

#### [fs-toc-omit]What if the design file is a mess and there is no organized color system?

This is likely to happen frequently. Some designers or clients may not structure their colors well, and it becomes our job to organize them for a more structured project. To understand how to do this, check the sections **How to Name the primitives** and **How to Name the Semantic tokens** above.

#### [fs-toc-omit]Can I just use the color name for a semantic variable?

This is not recommended. If you name a variable simply by its color, any change in color schemes or themes would require renaming the token. The whole point of semantic tokens is to keep things flexible and easy to update. So, it's better to go with names that describe the variable's role, not just its color.

#### [fs-toc-omit]How can I know which variables are the primitives?

Primitive tokens are identified by the prefix **- Base Color.**

#### [fs-toc-omit]How can I link variables with utility classes?

You can create utility classes that are linked to color variables. To do this, always use semantic tokens to maintain consistency, and be sure to use clear naming conventions that clearly describe the purpose of each color.

‍

---

<!-- source: https://finsweet.com/client-first/docs/fluid-responsive -->

USABILITY

## Fluid responsive

Add fluid responsive to any Client-First projects using a visual fluid scaling tool. No calculations, no writing custom CSS, no javascript.

### Tools

##### Two options for making our Client-First Webflow site fluid response

1. The visual CSS snippet configurator on this page
2. The same visual configurator in [Finsweet Extension](https://www.finsweet.com/extension/)

### What is fluid responsive?

> As the browser viewport changes size, the design scales with it.

#### Client-First fluid responsive compared to vw and vh scaling

As the browser viewport changes size, the design scales with it.

Using **vw** or **vh** units is one way to make our content fluid responsive when scaling. The problems with this method are:

- We must set **vw** or **vh** unit sizes on every element we want to be fluid responsive.
- Elements can quickly become too small or too large because of linear scaling. **vw** and **vh** scale linearly.
- Accessibility suffers because browser zooming cannot affect both **vw** and **vh** units.
- It can be challenging to manage and maintain our Webflow project in **vw** and **vh**, especially for other developers and clients.

Client-First uses "root-font scaling" instead.

#### Root-font scaling

> Client-First system uses **rem** units for all sizes. The **rem** unit is based on one thing — **HTML root font size**.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b80950e31c608e6b43be4_root-font-scaling.webp)

Everything in our project is relative to the HTMLfont size. Because of this, we have global-managed control over all sizes in our project.

By modifying this size, we are effectively making our **rems** "larger" or "smaller" visually. Our visual fluid responsive generator runs on an extensive set of calculations that modify root font size according to our preferences.

Adding the generated CSS code makes our Webflow project follow custom size scaling rules. Changing the HTML font size across breakpoints gives us ultimate customization of our fluid responsive scaling.

Benefits:

- Use Client-First like you usually use it. There is no specific workflow change for fluid responsive sites vs. non-fluid responsive sites.
- The fluid responsive strategy is an optional add-on. Add it, or don't add it, to any project.
- Fluid responsive can be added at the end of the project after everything is developed.
- Browsers can zoom normally.
- Browser font size settings that are modified by end-users will be respected.
- Maintaining a Webflow project in **rem** is easier than a project with fixed **vw** or **vh** based sizing.

### Visually build fluid responsiveness

Video is blocked. Accept cookies to watch it.

1. Visually configure the fluid responsive scaling rules.
2. Copy the CSS code to the Client-First Webflow project.
3. Enjoy a fluid responsive site in rems.

#### Fluid responsive generator‍

### Live stream explanation

##### Learn it Live #5

Explanation of fluid responsive generator tool.

Video is blocked. Accept cookies to watch it.

##### Learn it Live #8

Implementing fluid responsive generator tool on PS5 website build.

Video is blocked. Accept cookies to watch it.

---

<!-- source: https://finsweet.com/client-first/docs/semantic-html-tags -->

USABILITY

## Semantic HTML tags

Learn how to use and best establish semantic HTML tags inside Webflow.

### What are semantic HTML tags?

A semantic HTML tag clearly describes what an element is.

Elements such as <header>, <footer>, and <article> are all considered semantic. They describe the purpose of the element and the type of content that is inside the element.

Semantic tags are here to help users and machines better interpret our content.

##### Why do we want to use semantic HTML tags?

1. Make our site more accessible (Better user experience).
2. Improve how search engines crawl our website (Better SEO and discoverability).

##### What is accessibility?

If we take the definition of Wikipedia:

> “Accessibility refers to the design of products, devices, services, or environments for people who experience disabilities.”

Applying this to our web development field, we understand it as:

> “Web a11y means that **anyone** at **any moment** can use your website.”

If a user is sighted, it's easy to know what a sidebar is. It's easy to know what a nav is. It's easy to know what the main content is. A sighted user may not care about the difference between a regular <div> and a <main> tag. There may not be any change in their viewing experience.

However, people with screen readers and machine web crawlers rely on these descriptive tags to understand the page's content.

To follow best accessibility practices, we must use semantic HTML tags while developing.

### How to use semantic tags in Webflow

Webflow makes it super easy to add semantic HTML tags.

To change an element's tag, do the following:

1. Select the element
2. Go to the settings panel (D)
3. Choose a tag from the dropdown

##### How do I choose which tag to use?

These short descriptions are taken directly from Webflow Designer:

- **Header** - specifies a header for the document or a section
- **Footer** - defines a footer for the document or a section
- **Nav** - defines navigation links in the document
- **Main** - defines the main content of a document
- **Section** - defines a section in the document.
- **Article** - defines an article in the document
- **Aside** - defines content aside from the page content
- **Address** - defines the contact information for the author/owner of a document or an article
- **Figure** - defines self-contained content, like illustrations, diagrams, photos, code blocks, etc.
- **H1-H6** - these elements represent levels of section Headings from highest to lowest

There are many more semantic tags available to us as web developers. The tags above are the most important ones when using Webflow.

### Basic semantic structure

First, we will focus on **Header**, **Main**, and **Footer**.

#### Header - <header>

The header tag is most commonly used to wrap a website's navbar. In Client-First, we would most likely add this tag to our nav\_component or an equal.

But, it can also specify the header of a section or an article.

Both of these approaches are correct.

According to W3Schools, we can have more than one <header> tags on a page. However, a <header> cannot be placed within a <footer>, <address> or another <header> element.

###### The use of <header> is flexible and used differently throughout the web.

If we inspect other websites, we will see that some developers use the header tag only on the navbar, while others use the header tag multiple times.

For example, if we look at an article on the usa.gov website, we will see that each Heading (<h1> - <h6>) is wrapped with a header tag.

If we look at the article pages of the EU, we will see that only the header is used only to wrap the navbar.

#### Main - <main>

The main tag defines the main content of our page. On most pages, the <main> tag is used to wrap the "main" content of the page. It's usually everything between the <header> and the <footer>.

The content inside the <main> element should be unique to the page.

- The <header> and <footer> should not be included inside the <main> tag.
- The <main> tag should not contain any content that is repeated across pages, such as sidebars, navigation links, copyright information, site logos, search forms, or cookie consent.

The most common tags we will see inside the main are sections and articles.

In Client-First, we add the <main> tag to our *main-wrapper* class.

#### Footer - <footer>

A <footer> element usually contains:

- Authorship information
- Copyright information
- Contact information
- Sitemap
- "Back to top" links
- Related documents

The <footer> tag relates to the nearest sectioning parent. That can be either a section or the whole page.

For example, we might have a footer at the bottom of an article that relates to the article. We might have another footer at the bottom of our page that serves as our page footer.

### Sectioning elements

#### Section - <section>

A <section> tag is used for sectioning our web page.

Sections should always have a Heading, with very few exceptions.

In most cases, we will have several sections in our main.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b8157a5a2f97fb6eb4915_sectionsemantic-html.png)

Here’s a simple example of a website divided into sections.

Note that we can also have sections within an article tag, and vice versa. We can even have sections within sections.

#### Article - <article>

The <article> tag specifies independent, self-contained content.

An article should make sense on its own, and it should be possible to distribute it independently from the rest of the site.

A common misconception is using <article> tags only on blog posts.

We can use the <article> tag on any of the following:

- Forum post
- Magazine
- Newspaper article
- Blog entry
- Product card
- User-submitted comment
- Interactive widget or gadget
- or any other independent item of content.

#### Aside- <aside>

The <aside> tag defines some content "aside" from the primary content.

The aside content should relate to the surrounding content.

Use the aside tag to wrap:

- Page related sidebars
- Related links
- Related content
- Advertisements
- Tables of content

The aside element should be inside the related section element. This means that if our aside relates to a section, it should be inside that section.

If our aside relates to the whole page, then place it outside any section tag. For example, we could place next to the <main>.

#### Nav - <nav>

The nav element specifies a list of navigation links.

Here are some common places where we want to use the <nav> tag:

- Navbar links
- Sidebar links
- Table of content
- Footer links
- Breadcrumbs

### Headings - <h1> - <h6>

The h1 to h6 elements represent six levels of section Headings. <h1> is the highest section level. and <h6> is the lowest.

#### Use only one h1 per page

The <h1> should be the title of our page.

When a user lands on our site and reads the <h1> Heading, they should understand what the page is about. Our <h1> should be descriptive and clear.

#### Nesting Headings

Use the <h2> tag to cover subtopics of our <h1>.

Use the <h3> tag should be used to cover subtopics of the <h2> and so on.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b8187182168928fd50a02_nesting-headings.png)

Users with screen readers often jump from Heading to Heading to understand our page.

Because of this, it’s essential not to skip Heading levels. Skipping a Heading level may create confusion, as the person navigating this way may wonder where the missing Heading is.

### Figures, addresses and others.

#### Address - <address>

The <address> tag specifies contact information for the author/owner of a page or an article.

We can have more than one article tag on a page.

If we place the <address> tag within an <article>, it refers to the article.

When an address tag is placed outside of an article, then it refers to the whole page.

For example, if we include our company’s address in the footer, the <address> tag will refer to the whole page (document).

#### Figure - <figure>

The <figure> tag specifies self-contained content, like illustrations, diagrams, photos, code listings, etc.

While the content of the <figure> element relates to the main flow, its position is independent of the main flow. Removing a figure should not affect the flow of the page.

We might have noticed that the <figure> tag is automatically added around any Rich Text image or video when we add a description.

We can use this tag to wrap images when we see fit.

Note that the <figure> tag is not as crucial for accessibility and SEO as adding **alt text** to the visual content.

### Semantic HTML cloneable

We developed cloneable project that outlines semantic HTML tags inside a Webflow project. The cloneble helps us visualize the correct use of HTML semantic tags.

‍[Get the Semantic HTML cloneable here.](https://finsweet.info/semantic-html-cloneable)

---

<!-- source: https://finsweet.com/client-first/docs/accessibility -->

USABILITY

## Accessibility

Follow best accessibility practices in Webflow.

This docs page is not specific to Client-First. It covers accessibility inside Webflow as a platform.

### What is Accessibility?

The term accessibility (commonly referred as **a11y**) is not only restricted to web development, but applies to many different aspects of life.

If we take the definition of Wikipedia:

> “Accessibility refers to the design of products, devices, services, or environments for people who experience disabilities.”

Applying this to our web development field, we understand it as:

> “Web a11y means that **anyone** at **any moment** can use your website.”

#### Why is Web Accessibility so important?

Don’t fall under the widespread assumption that a11y is only needed for people with severe disabilities like blindness or reduced mobility. There are actually more types of disabilities that usually people don’t think of:

1. **Permanently disabled users:** The user has a severe disability like blindness or deafness.
2. **Temporary disabled users:** The user has a physical or mental disability which hinders his discharging of responsibilities for a short period of time.
3. **Conditional or Situational disabled users:** The user is not able to do things due to the current situation he is in. Example: slow internet connection, browsing while eating...

#### About this guide

This guide won’t go too deep into the basics of a11y, as there is already a lot of quality content available. Check out [A11y Project Checklist](https://www.a11yproject.com/checklist/) and [Webflow’s Accessibility Checklist](https://webflow.com/accessibility/checklist).

Instead, this docs page will focus on specific accessibility challenges that we experience inside Webflow as a platform.

### Keyboard navigation

Due to physical restrictions, many users rely on the keyboard to navigate through our site. This section explains how we can make sure our whole site is keyboard navigation friendly.

#### Basic controls

##### Tab Key

The Tab key is used to move around the page by focusing the available elements. Every time the user hits the Tab key, the focus will move to the next focusable element. Holding Shift reverses the direction.

- It is important to make sure that all elements a regular mouse user would click on the page are also focusable with the Tab key (see Using tabindex).
- This also implies that all focusable items should have their focus state styled, otherwise the users won’t be able to distinguish what element they are currently focusing on.

##### Enter Key

When focusing an element, the Enter key should:

- **[Finsweet solution coming soon]** Activate links or buttons. Non-standard elements like divs using a role attribute need JS implemented for this.
- Send forms.

##### Space Key

When focusing an element, the Space key should:

- **[Finsweet solution coming soon]** Activate buttons.

- Activate toggle states like checkboxes or radios. This also includes buttons that toggle some functionality like an accordion.

##### Arrow Keys

When focusing an element, the Arrow keys should:

- **[Finsweet solution coming soon]** Navigate through grouped children of a component (like Tab Links, Radio buttons, Accordion Toggles, etc).
- Change the value of it (like range sliders or number inputs).

##### Esc Key

The Esc key should allow the user from exiting different states like:

- **[Finsweet solution coming soon]** Closing a modal.

### Focusability

All elements that are clickable on the page should be focusable too. Standard HTML elements have this functionality built-in by default, but sometimes we need to tell the browsers to do so.

In these cases it can be achieved by adding the tabindex attribute.

The value set to it will depend on the wanted behavior:

- **tabindex=”0”**: Makes the element focusable with keyboard navigation, following the natural order of the page.
- **tabindex=”X”**: where X is any desired number greater than 0. When explicitly setting this number, we're stating the order when this element should be focused. Example: the element with tabindex=”26” will be focused after the element with tabindex=”25”.

- **tabindex=”-1”**: Disables the focusing of an element. This comes handy in some situations where we have a native focusable element that doesn’t provide any interactivity.

#### Programmatic focus

**[Finsweet solution coming soon]**

To improve the UX for keyboard navigation and screen readers, sometimes it’s a good idea to programmatically focus an element when a certain condition is met.

Some examples are focusing the close button right after opening a modal, or moving the focus to a certain element that appeared on the page.

However, always think of the UX! There are some cases where it’s not a good idea to automatically focus an element that appears on the page, like when switching tabs in a Tabs component.

### HTML Semantics

#### Using <button> tags in Webflow

The main purpose of this tag is to tell the user that an element is clickable and will **trigger an action on the page**. This includes actions like expanding/collapsing elements (example: accordions), showing/hiding elements (example: hamburger menu or dropdown list) or custom app-like functionalities like a TO-DO item to a list.

**Do not confuse <button> tags with the Button component in Webflow!**

It's important to understand the difference between <button> tags and <a> tags:

- <button> activate actions on the page.
- <a> navigate through the page / website

Behind the curtains, the Webflow Button component is just a regular html anchor link (<a> tag) with some styles sprinkled on top of it:

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b82d4359714d42a1531a5_button-tags-accessibility.png)

Unfortunately, using the <button> tag in Webflow is not possible to do as of the time of writing this guide (unless using an Embed component, which is not ideal).

When the use of a <button> tag is needed, we must use a <div> instead with the following conditions:

- It has a [role=”button”](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/button_role) attribute.
- It’s keyboard focusable with the tabindex attribute.
- **[Finsweet solution coming soon]** It fires a click event when the Enter or Space key is pressed.
- **[Finsweet solution coming soon]** If the button has pressed/not pressed states (like a toggle), it must have an aria-pressed attribute reflecting the current state.
- **[Finsweet solution coming soon]** If the button controls the expansion/collapse of another element (like an accordion), it must have an aria-expanded attribute reflecting the current state.

#### Creating HTML Tables in Webflow

The <table> element is not available to be used natively in Webflow.

We can still build accessible tables using regular *Divs* (meaning that a screen reader will be able to read the content in the proper order, following rows and columns) using the ARIA roles defined for this purpose. This is shown in this guide in the *ARIA Roles: role=”table”* section.

### Hiding elements on the page

Aside from the most famous **display: none** style, that hides the element from the structure of our page, there are some times where we want an element to only be visible to a part of the user base.

#### Hiding elements from screen readers only

While parsing the content of our page, a screen reader will read out loud as much information as it can to describe it to the user.

There are some elements though that do not have any information attached to them, such as visual elements like styled divs or svg elements.

In those cases we want the screen readers to just skip them so they don’t break the reading flow.

This can be achieved by using the aria-hidden attribute. More on this in the ARIA section below.

#### Hiding elements for regular users only

On the other hand, there are some times where we are using a visual representation of some content (like a fancy **svg** as the title of our page), but still want to provide context of it to screen readers (and crawling bots!).

We can achieve this by using CSS to visually hiding the content in a way that it will still be picked by screen readers and crawling bots:

###### .fs-a11y\_visually-hidden {    position: absolute;    clip: rect(1px, 1px, 1px, 1px);    clip-path: inset(0px 0px 99.9% 99.9%);    overflow: hidden;    height: 1px;    width: 1px;    padding: 0;    border: 0; }

This technique is used by many big sites like Apple!

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b82f373b0f4239a060db6_hiding-elements-accessibility.png)

### ARIA

The [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) describe ARIA as:

*“Accessible Rich Internet Applications (ARIA) is a set of attributes that define ways to make web content and web applications (especially those developed with JavaScript) more accessible to people with disabilities.”*

When building static sites with no interactivity, usually sticking to just using correct HTML semantics is almost enough.

But when adding custom functionalities using Javascript (Webflow Interactions count as it!), we need to provide more context to the users with disabilities so they can correctly read and use our site.

**Note: Webflow’s native components like Navbar, Slider, Tabs, etc already use the correct aria attributes with the required Javascript for the dynamic ones.**

#### ARIA Roles

Elements that provide a specific functionality to the page (thus they perform a role) must be defined so screen readers can understand the context of the actions / situations.

When using basic HTML semantic elements (like <button>, <nav>, <a>, <input>, etc…), these **role** attributes are not needed, as both the browser and the screen reader devices already understand their purpose.

We won’t list all of the available roles. Below are the most commonly used ones. We can check the full list on [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles).

##### *role=”button”*

Used to define an element that doesn’t have a <button> tag that is acting like it.

##### *role=”listbox”*

Used to define an element that contains a list of options to choose from.

##### *role=”option”*

Used to define an element that represents an option in a list of options. Usually combined with the aria-selected attribute.

##### *role=”table”*, *role=”rowgroup”*, *role=”rowheader”*, *role=”row”*, *role=”columnheader”*

Used to define an HTML Table structure, where:

- **role=”table”** corresponds to the <table> element.
- **role=”rowgroup”** corresponds to the <tbody> element.
- **role=”rowheader”** corresponds to the <thead> element.
- **role=”row”** corresponds to the <tr> element.
- **role=”columnheader”** corresponds to the <th> element.

#### ARIA Attributes

##### *aria-label*

How an element is announced by a screen reader is usually determined by its content

For example, a text-link like this:

###### <a href="https://www.webflow.com">Go to Webflow!</a>

Will be read out loud as “Go to Webflow!”. But there are some times where the content doesn’t explain the action that will be performed, or maybe there isn’t any content at all.

In those cases, using **aria-label** will let us give more context to the user.

Example:

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b83125243ed5b2cc9faaa_aria-label-accessibility.webp)

##### *aria-labelledby*

**aria-labelledby**, as the name already says, lets us give more context to an element by pointing to another element that explains it.

The attribute is used like:

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659bf60ec10f331d3034c66a_no-layout-system-2-class-strategy-2.webp)

Where the element with an ID of **“button-id”** has some content in it that provides context to the user.

##### *aria-describedby*

In addition to an element's label, screen readers can announce a referenced element as its description, so the user can understand the context more deeply.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659cc0450297fe1ddbbe34b0_aria-describedby-accessibility.webp)

Where **“description-paragraph”** is the ID of the element that holds the description of the context.

##### *aria-controls*

This attribute creates a cause and effect relationship. It identifies the element(s) that are controlled by the current element.

Example: a button that opens a modal when clicking on it should have:

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b833a77b008b56bc740f7_aria-crontrols-accessibility.webp)

Where **“modal”** is the ID of the modal element.

##### *aria-expanded*

**[Finsweet solution coming soon]**

There are many situations where a user needs to be able to toggle an element’s visibility, such as when opening a hamburger menu or a modal dialog.

Usually, when an element becomes visible on the page, the user spots it right away. This is not the case for blind people, who need their screen reader devices to notify them about these changes.

This is where aria-expanded comes into place, allowing us to define the status of the element that is being controlled.

This attribute should be paired with the aria-controls one to provide the full context of the action to the user.

The value is set to true/false using Javascript depending on the element’s state:**‍**

**aria-expanded=”true”**

##### *aria-haspopup*

Complimentary to the aria-expanded attribute, we can further define what has been expanded with this attribute. It accepts the following values:

- **aria-haspopup=”menu”**, indicates the popup is a menu.
- **aria-haspopup=”listbox”**, indicates the popup is a listbox.
- **aria-haspopup=”tree”**, indicates the popup is a tree.
- **aria-haspopup=”grid”**, indicates the popup is a grid.
- **aria-haspopup=”dialog”**, indicates the popup is a dialog.

##### *aria-pressed*

**[Finsweet solution coming soon]**

Some elements require a visual confirmation that have been pressed, like a custom Switch being toggled on/off. Screen readers can be notified about this newly achieved state with the aria-pressed attribute.

The value is set to true/false using Javascript depending on the element’s state:**‍**

**aria-expanded=”true”**

##### *aria-current*

**[Finsweet solution coming soon]**

Used to identify the “current” item in a set of items. This has different applications:

- **Page:** used as *aria-current=”page”*, defines an element that has the current URL where the user is located. Usually set to the links that point to the current page.  
  Important: Webflow’s *Current* state in the Designer only adds a *w--current* CSS class to the element, but not the aria-current attribute.
- **Location:** used as *aria-current=”location”*, defines an element that has the current page description where the user is located. A good example where to use this attribute is in a Breadcrumbs component, where the element describing the current page would get it.
- **Date:** used as *aria-current=”date”*, defines an element that has the current date. Commonly used in calendars and date pickers.
- **Step**: used as *aria-current=”step”*, defines an element that is indicating the current step in a multi-step process (like a multi-step form).

##### *aria-selected*

**[Finsweet solution coming soon]**

When building custom selection interfaces (like a custom dropdown of options or a combo box), we need to notify to screen readers what element is the one selected at any moment.

This attribute must be set dynamically, pointing to the element in the list that is currently selected:

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b8351c489a49f489e1f0c_aria-selected-accessibility.webp)

Where **“option-2”** is the ID of the selected element.

##### *aria-hidden*

**[Finsweet solution coming soon]**

As seen in hiding elements only from screen readers, sometimes a visual element provides no context to the user when reading it with a screen reader.

Setting the attribute **aria-hidden=”true”** will make them skip this element from being read out loud.

### Commonly used components

#### Building accordions in Webflow

**Trigger:**

- **[Finsweet solution coming soon]** USWDS uses <button> tags, we will have to rely on divs with the role=”button” and use JS to trigger a click event on Enter or Space key.
- If using a div , it needs to have tabindex to make it keyboard navigable. It should also have its focus state styled.
- Use aria-controls for defining the collapsible content.
- **[Finsweet solution coming soon]** Use aria-expanded for defining the state of the collapsible content.

**Content:**

- Should not be hidden by default. Rely on JS to hide it when the page loads (this can be done with ix2) to make sure people with disabled JS can see it.
- Use aria-labelledby to define the trigger of it.

**Other cool stuff we’ve found:**

- When there are more than one accordion, using the Arrow keys should move the focus between triggers, using the Home key should focus the first accordion and using the End key should focus the last accordion. Check it out here: <https://www.w3.org/TR/wai-aria-practices-1.1/examples/accordion/accordion.html>

### Bad practices for accessibility

#### Not using HTML semantic elements when available

There are some cases (like the <button> elements) where we are forced to find a workaround due to Webflow not providing them natively.

But there are other cases where using a role approach doesn’t make sense.

##### For example: links

Doing this:

###### <a href="https://www.google.com">Go to Google</a>

Is obviously preferred over this:

###### <div role="link" onclick= "window.location.replace ('https://www.google.com')">Go to Google</div>

Although the regular users will notice no difference at all, disabled users will not be able to navigate to the element and activate it with the keyboard, as well as other issues like SEO indexing of the link.

It might seem obvious with this example, but there are other use cases where something like this could happen.

#### Adding redundant WAI-ARIA attributes

Semantic elements (a, form, nav, etc…) will already be read by the screen readers. Adding to them an additional role attribute will cause the screen reader to read it twice, which can get very annoying.

##### For example: forms

The following element will be read as “Form, Form”:

###### <form role="form"></form>

### Accessibility cloneable

We have created a cloneable to help us get started with accessibility inside Webflow. The Accessible Form Filter Components offers cloneable Filter UI components that are accessible. Each example has an in-depth explanation about how to make the component accessible.

‍[Access the accessibility cloneable here](https://webflow.com/made-in-webflow/website/accessible-form-filter-components?gspk=NDg2ODEzOQ&gsxid=k9r2WJs49iEB&utm_medium=affiliate).

‍

#### Thanks! That's all for now!

We are actively working on our Attributes platform that will give us the power to implement everything in this guide.

[Stay updated with Finsweet content](https://www.finsweet.com/subscribe) to stay updated with our a11y updates.

---

<!-- source: https://finsweet.com/client-first/docs/learning-path -->

GETTING STARTED

## Learning path

A 7-day schedule to learn Client-First

### Recommended Client-First learning path

###### **New to Webflow?** Before learning Client-First, we recommend learning the basics of Webflow and web principles. Client-First does not teach HTML or CSS. It's important to have a beginner-level understanding of web topics before learning Client-First. Read our [Beginners in Webflow](https://finsweet.com/client-first/docs/beginners) content.

### 7 days of learning

#### Day #01

[Intro

New

Intro to Client-First with an overview of the essential principles.](https://finsweet.com/client-first/docs/intro)[Classes strategy 1

rewrite

Strategy for how we identify, use, and manage classes inside Webflow as a platform.](https://finsweet.com/client-first/docs/classes-strategy-1)[Core structure strategy

New

Establish a unified, well-defined, and flexible structure that we can use for all pages across Client-First websites.](https://finsweet.com/client-first/docs/core-structure-strategy)[Sizes and rems

rewrite

Explanation of REM units, 4pt system, and how we approach measurements in Client-First.](https://finsweet.com/client-first/docs/sizes-and-rem)

#### Day #02

[Typography strategy

New

Build and maintain a unified typography style system across the project.](https://finsweet.com/client-first/docs/typography-strategy)[Spacing strategy

New

Make intelligent spacing decisions inside Client-First.](https://finsweet.com/client-first/docs/spacing-strategy)[Utility class systems

rewrite

Review the utility class systems included with the official Client-First project cloneable.](https://finsweet.com/client-first/docs/utility-class-systems)

#### Day #03

[Classes strategy 2

Rewrite

Theory of best workflow practices for classes in Webflow Designer.](https://finsweet.com/client-first/docs/classes-strategy-2)[Folders

Super New

Finsweet introduces a folder system add-on for Client-First. Organize our project's classes with Folders.](https://finsweet.com/client-first/docs/folders)[Folders strategy

Super new

Next steps with Client-First Folders. Explore deeper use cases and strategies around Folders.](https://finsweet.com/client-first/docs/folders-strategy)[Variables

Super new

Color variables in Webflow and how Client-First uses them — Strategies, naming conventions, and practical usage tips.](https://finsweet.com/client-first/docs/variables)

#### Day #04

[Fluid responsive

Rewrite

Add fluid responsive to any Client-First projects using a visual fluid scaling tool.](https://finsweet.com/client-first/docs/fluid-responsive)[Semantic HTML tags

New

Learn how to use and best establish semantic HTML tags inside Webflow.](https://finsweet.com/client-first/docs/semantic-html-tags)[Accessibility

rewrite

Follow best accessibility practices in Webflow.](https://finsweet.com/client-first/docs/accessibility)

#### Day #05

[Global embed

New

Explanation of each CSS snippet in the Global Embed of the Client-First cloneable.](https://finsweet.com/client-first/docs/global-styles-embed)[CSS specificity

New

Learn the concept of CSS Specificity and how it relates to using Client-First's spacing system in Webflow.](https://finsweet.com/client-first/docs/css-specificity)[Convert past projects

New

Understand the decision to convert an old project to Client-First.](https://finsweet.com/client-first/docs/convert-past-projects)

#### Day #06

[Sales strategy

New

Learn how we can leverage Client-First to win more projects and keep our clients happy.](https://finsweet.com/client-first/docs/sales-strategy)[Client-First productivity series

New

Client-First workflow enhancement productivity video series.](https://finsweet.com/client-first/docs/productivity-client-first)[Webflow productivity series

New

Webflow workflow enhancement productivity video series.](https://finsweet.com/client-first/docs/productivity-webflow)

#### Day #07

[Beginners in Webflow

New

Before learning Client-First, it's essential to have a base understanding of the web.](https://finsweet.com/client-first/docs/beginners)[New

Dictionary

The meaning of the terms used to explain the client-first.](https://finsweet.com/client-first/docs/dictionary)[Changelog

New

Key updates in from Client-First launch to today.](https://finsweet.com/client-first/docs/changelog)

---

<!-- source: https://finsweet.com/client-first/docs/css-specificity -->

SUPPORTING CONTENT

## CSS specificity

Learn the concept of CSS Specificity and how it relates to using Client-First's spacing system in Webflow.

### Intro

> CSS Specificity determines which CSS property values are most important to an element. If an element has two CSS property values, the one with the higher specificity wins, and its property value is applied to the element.

It's not simple, but it's important. It's something anyone can understand with education and practice.

CSS Specificity is not an issue specific to Client-First. It is not an issue that Client-First is creating. It is how CSS works.

###### The specificity principle most relevant to the Client-First system is: Classes added to the CSS style sheet latest will "win" when there are CSS property value conflicts.

We will learn how it works through an example inside the Client-First Style System. There is a common workflow problem when adding Client-First styles to a project.

**If we copy-paste Client-First margin and padding classes to another project in the wrong order, the classes will not work as expected.**

### Client-First spacing example

#### When will the Client-First spacing system NOT work?

We copy-paste the spacing system from our official starter project into another project by following the below steps:

1. Inside the start project, go to the Style Guide page and open the Navigator.
2. Copy the *fs-styleguide\_spacing-directions* 'folder' and paste it into the new project.
3. Then, copy-paste the *fs-styleguide\_spacing-sizes* 'folder' and paste it into the new project.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/116297ebb4c134077bd9128b44a9e0e4/manifest/video.m3u8)

The Client-First margin classes should be ready to use after copying all of the classes into the project. However, the spacing system will not work with this order of operations.

Everything works as expected when we add a new Div Block to the page and apply *margin-bottom* to it.

If we add *margin-large* to it, we expect a large margin to be applied to the top side.

**However, a large margin is added to all sides. This is not intended.**

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/50da363107c47fbf151525b9cc77872b/manifest/video.m3u8)

We **can not** use Client-First spacing system like this.

#### Why this example does not work? CSS Specificity.

The size classes were added to the project **after** the direction classes. Because of this, the size classes are **more specific** to the project’s specificity.

###### *margin-top* was added to the Webflow project first, then *margin-large* was added to the Webflow project.

When we create styles inside Webflow, the styles are generated on the CSS stylesheet in the order they were created in the Webflow project.

One principle of CSS Specificity is "Order of creation".

The rules of CSS Specificity consider a class created lower (later) in the CSS stylesheet to be more specific to the website than the styles created higher (earlier) in the CSS stylesheet.

A class created later in our Webflow project (*margin-large*) has a higher weight than the class created earlier in our Webflow project (*margin-top*).

If those two classes have the same CSS property applied to them (*margin*), the class with the higher weight will 'win', and the style property declaration of that class will be applied to the element.

*margin-large* has a higher weight than *margin-top*, so it will overwrite the styles of  *margin-top*. *margin-large* has margin applied to all sides. Those styles take priority and overwrite the 0rem margins of our *margin-top* class.

We need the class *margin-top* to overwrite the *margin-large* on all sides. We must switch the order of the creation for the spacing system to work.

#### When will the spacing system work?

##### 1. Client-First starter project cloneable (Recommended)

When we use the [official Client-First starter project](https://webflow.com/website/client-first-cloneable?gspk=NDg2ODEzOQ&gsxid=u083NZhWFUxy&utm_medium=affiliate), the spacing classes will be created in the correct order. We do not have to worry about the example above occurring in our project.

##### 2. Finsweet Extension > Client-First

Using Finsweet Extension, we can copy the complete Client-First spacing system — without CSS Specificity issues. *margin-[size]* classes will automatically be added to the project first, and *margin-[direction]* classes will automatically be added to the project second.

##### 3. This workflow

We copy-paste the spacing system from our official Client-First starter project into another project by following the below steps:

1. Inside the starter project, go to the Style Guide page and open the Navigator.
2. In the Navigator, open *fs-styleguide\_classes* >*fs-styleguide\_spacing-all*‍
3. Copy the *fs-styleguide\_spacing-sizes* 'folder' and paste it into the new project.
4. Then, copy-paste the *fs-styleguide\_spacing-directions* 'folder' and paste it into the new project.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/4b33cbe5397b1e80f931e67c5c2c2ad1/manifest/video.m3u8)

Now, when we add a new div block to the page, apply *margin-bottom* to it, and then apply *margin-large* on top, it works.

The *margin-bottom* will be applied only to the top side of the div block.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/649f64d39881f8209e4e9ae4fb517c38/manifest/video.m3u8)

### CSS Specificity 'display: none' example

Remember that CSS Specificity is not specific to Client-First or our spacing system. We will walk through an example that has nothing to do with spacing. CSS Specificity issues can occur on any Webflow project, regardless of build strategy.

First we will add a *display-none* class, which will set the **display** property to **none**. We intend to use this class throughout our project as a utility class to apply anywhere in our project.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b85a091a7b74d1e5ec271_display-nonecss-specificity.webp)

‍

Next, let’s create an element called *background-error*, with its **display** set to **block** and its **background** set to **red**.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/659b858f01424df0c0c399a7_background-errorcss-specificity.webp)

When we add *display-none* to *background-error* as a combo class, our first thought is the *background-red* should be set to **display: none**.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/34fc9fb3f4825e0d531f45348ca1da34/manifest/video.m3u8)

Because of CSS Specificity, this does not happen. The **display** property on *display-none* is ignored.

Since *background-error* was created **after** *display-none*, it is more specific to the stylesheet and the project.

The display property of *background-error* has more weight than the display property of *display-none*, which makes *background-error* win.

#### Fixing with Finsweet Extension

The CSS Styles Reorder Candy in Finsweet Extension will allow us to reorder the classes on our project's .css stylesheet.

The above **display: none** use case is an excellent example of why we added this functionality. We can fix the problem above quickly and reliably with Finsweet Extension.

1. Open the Extension, select Candies, and then CSS Styles Reorder.
2. Move the *background-error* class before the *display-none* in the list of classes and Save.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/6c71fbbbd70f4e86aec84200091472f1/manifest/video.m3u8)

This action visually changes the order of the styles in the CSS file. This tool can fix any order of creation CSS Specificity issue inside Webflow.

Now, *background-error* is first, and *display-none* is second on the style sheet. Now we can use our *display-none* class as intended.

[

Sorry, your browser doesn't support embedded videos.
](https://cloudflarestream.com/06fb6746b0a47bb40a0b8ad020ce03a8/manifest/video.m3u8)

When *display-none* is the last class on the stylesheet, it will be truly global in nature. It can overwrite the **display** property of any class in the project.

### Live session video explanation

Below is a video from an F'in Live episode that explains much of this page's content. The full written page is a more in-depth explanation.

Video is blocked. Accept cookies to watch it.

### Conclusion and next steps

The information above is a small piece of CSS Specificity. It's a complex concept with a list of many defined rules. Above we learn one of those rules — the order of classes on the .css stylesheet.

Understanding every part of CSS Specificity is not required to be a pro in Webflow. However, when we understand advanced concepts like this, we take our Webflow knowledge to the next level.

Understanding CSS Specificity gives us a deeper connection to the CSS in our project. The more we understand it, the deeper the connection.

There's a lot of content about CSS Specificity online. Start with [W3 Schools CSS Specificity documentation](https://www.w3schools.com/css/css_specificity.asp) page to learn more.

---

<!-- source: https://finsweet.com/client-first/docs/sales-strategy -->

SUPPORTING CONTENT

## Sales strategy

Learn how we can leverage Client-First to win more projects and keep our clients happy.

### Why "Client-First"?

Client-First is named after our clients and the idea of putting them "first" in our Webflow development project.

This does not mean Client-First must be used for client websites only. The mentality behind Client-First is what's important. It works for

##### Our client focused goals for Client-First are to enable someone to:

- Make big changes to the Webflow project.
- Read most classes in the project and understand their purpose.
- Scale the website based on the organization in the project.
- Learn Client-First if they wish to do so.
- Continue working with us effectively
- Maintain the project with a different Webflow developer

##### Client-First is for everyone

"Everyone" can be a a client, a developer on our team, a developer at a different agency, a freelancer, or a random marketer opening Webflow for the first time.

The goals and initiatives of Client-First relate to any other person accessing our Webflow project, not clients only.

It is in our client's best interest to develop and deliver a website we can hand off to another agency or freelancer. If we no longer work with the client, we want the next team in the project to continue managing it without issues.

The term "Client-First" can help us in our Webflow sales pitch.

### Service sales basics

> The most effective sale is when both parties reach an equal appreciation for the sale.

##### Both parties should be happy about what happened in the sale

- The buyer should be happy to pay the seller the money. The money the buyer pays for the service feels fair and of good value.
- The seller should be happy to give the service for the agreed-upon price. The seller feels that they are being paid well for their time.
- An added benefit is when neither party believes they got the better outcome. In an ideal sales state, both parties feel an equal and fair exchange of service for money.

##### Making someone happy to pay us

###### Lead: a person we are selling our Webflow services to

Leads can be happy to pay for our services as Webflow developers.

If all of the following are true we can make a lead happy to pay us:

- Our lead has a problem.
- We can fix that problem with our service.
- Our cost to fix that person's problem is reasonable **for that specific lead**.

##### We are not tricking leads. We are helping leads.

We never want to look at sales as tricks or clever gimmicks. This type of sales is why "sales" as a concept often gets a bad reputation.

###### Effective sales is helping people so much that they are happy to pay us — and even more excited with the outcome.

We help our leads by:

- Creating a powerful, efficient, and scalable Webflow project.
- Migrating [their previous website infrastructure] to Webflow.
- Improving their brand appearance with a better built website.
- Helping them grow their business through Webflow.

These topics are essential when selling our value as a Client-First Webflow developer.

### Selling Client-First

The first step is to understand the lead's problem.

**What does the lead want?**

**What does the lead want to improve or fix?**

Understanding these answers will help us shape our pitch for Client-First. We only want to share Client-First information that our lead is interested in.

For example, if our lead says they will never touch Webflow Designer, we will not start our pitch by explaining how they can benefit from reading the classes or learning Client-First.

Instead, we may start talking about how it will be easy for other Webflow developers to onboard themselves to the site. Maintenance will be easier, regardless of who works on the project next. Client-First comes with extensive documentation and is designed around a low learning curve.

Below we go through the two primary use cases we see from post-launch management — **I want to scale the Webflow project internally**, and **I want to scale the project with a Webflow professional**.

#### Client: I want to scale the Webflow project internally

In this example, the client wants to scale the website themself or with their internal team.

If our client wants to control future website updates, our sales strategy should focus on helping our client achieve that initiative.

Of our Client-First goals above, we may want to focus on these four —

##### **Enable someone to make big changes to the Webflow project**

Share your screen while using Webflow Designer. Show the lead a Client-First project that you have built in the past. Explain the level of organization and clarity that Client-First offers.

Show how small changes can make a significant change on the website. For example, changing the *container-large* and *padding-global* classes. Show significant, simple-to-manage changes that can make a big impact in the project.

##### **Enable someone to read most classes in the project and understand their purpose**

Show the lead the simple naming of classes. Show Folders and logical naming convention in Client-First. Explain how class names are named for non-technical Webflow users to understand.

##### **Enable someone to scale the website based on the organization in the project**

Show a symbol system, CMS system, and any optimizations inside a Client-First project to help build more pages or sections. Show the lead how quick it is to do something to grow the website. Show the style guide and how all utility styles are organized on one Draft page.

##### **Enable someone to learn our Webflow Style System if they wish to do so**

Some leads do want to learn Webflow and fully control their Webflow project. Understanding the Client-First docs can help them understand their Webflow project on a new level.

Show the lead the extensive Client-First, docs, resources, content, and community impact. Our delivered Webflow project comes with a style guide with the project's styles and comprehensive documentation outlining the mentality behind the project build.

#### Client: I want to scale the project with a Webflow professional

##### Enable our client to continue working with us effectively

If we offer any maintenance or post-project service, we want to enable our client to continue working with us on the project. We want maintenance to be a fast, efficient, and enjoyable process. If we used Client-First correctly, we have just built a website that enables us to:

- Make meaningful changes to the Webflow project.
- Read most classes in the project and understand their purpose, even months after development.
- Scale the website based on the organization in the project.

###### The invitation to continue working with our lead post-launch should be part of our sales strategy.

A website is rarely a "build and done" project. It often requires updates and maintenance work. Leads want to know they have someone to rely on after completing the website project.

Explain to them how Client-First enables you to work faster and make more meaningful updates after the website launches. Client-First will lead to an effective post-project relationship.

##### Enable our client to find maintenance for the project with a different Webflow developer

For many reasons, we may not be the developers continuing to build inside the project. We must always think of "the next person" that manages the build after us — even if it's a developer we do not know.

Webflow developers that already use Client-First will be able to start working on the project quickly. The system is meant for project development between different developers.

The amount of available Webflow professionals using Client-First is high and will continue to grow. This will enable our client to find a different developer who understands the site.

Webflow developers who do not use Client-First can pick up the system more quickly. We focus on organization and named classes, which lowers the learning curve.

### Community impact

Many Webflow developers have shared positive comments around Client-First. We have hundreds of tweets, posts, and messages showing powerful reinforcement of Client-First Style System.

Feedback and testimonials are important selling tools. Have our lead understand that you are not the only Webflow developer that uses Client-First. There's a large community of Webflow professionals that love it.

### Always deliver your promises

This page explains how we can use Client-First to improve the sales and leverage it to close more project sales. We must be honest and make the right promises during the sales process.

The content above is about making promises. We promise that we will:

- Fix X problem for our client.
- Build an organized, scalable site.
- Maintain the project efficiently and at a low cost.

We must follow through with these promises if we make them during the sales process.

###### Do not make promises in the sales process that we cannot keep.

It is better to lose the sale and be honest than win the sale and make a promise that we cannot keep.

Always make sure that we are making promises that we can keep and deliver. This mindset is crucial to building and growing a business.

### More on sales

#### F'in Growth

Check out [F'in Growth](https://www.youtube.com/playlist?list=PLpjTM82q4Gu45ENLV8fTsFXI1-YQaxMtx) live stream episodes related to sales. We have a lot of education around sales + Webflow.

---

<!-- source: https://finsweet.com/client-first/docs/productivity-client-first -->

SUPPORTING CONTENT

## Client-First productivity

Client-First workflow enhancement productivity video series.

###### **These videos use Client-First V1** All of the concepts and productivity benefits shown in these videos apply to Client-First V2. Only be aware that we may see some V1 utility classes and methodologies in this video series.

### [Intro ⭷](https://www.youtube.com/watch?v=Y_FRWkNZDFM)

Video is blocked. Accept cookies to watch it.

### [Structure ⭷](https://www.youtube.com/watch?v=efTUjiNp7SE)

Video is blocked. Accept cookies to watch it.

### [Spacing ⭷](https://www.youtube.com/watch?v=scduv_-rwD0)

Video is blocked. Accept cookies to watch it.

### [Class tips ⭷](https://www.youtube.com/watch?v=nZIXB7LWqTs)

Video is blocked. Accept cookies to watch it.

### [Typography ⭷](https://www.youtube.com/watch?v=ekE4L2YFoRQ)

Video is blocked. Accept cookies to watch it.

### [Global styles ⭷](https://www.youtube.com/watch?v=a4kkefX4ErI)

Video is blocked. Accept cookies to watch it.

‍

‍

---

<!-- source: https://finsweet.com/client-first/docs/productivity-webflow -->

SUPPORTING CONTENT

## Webflow productivity

Webflow workflow enhancement productivity video series.

###### **These videos use Client-First V1** All of the concepts and productivity benefits shown in these videos apply to Client-First V2. Only be aware that we may see some V1 utility classes and methodologies in this video series.

### [Increase your productivity with Webflow Shortcuts](https://www.youtube.com/watch?v=zoFtkwT4jlo&list=PLpjTM82q4Gu5HzMZtmQATTj8KAItmfHXw)

Video is blocked. Accept cookies to watch it.

### [Macros structural Webflow Symbols ⭷](https://www.youtube.com/watch?v=NiQW31R6JKk&list=PLpjTM82q4Gu5HzMZtmQATTj8KAItmfHXw&index=3)

Video is blocked. Accept cookies to watch it.

### [How to use the Finder like a pro (Secret settings) ⭷](https://www.youtube.com/watch?v=dBMfvQNOSwo&list=PLpjTM82q4Gu5HzMZtmQATTj8KAItmfHXw&index=4)

Video is blocked. Accept cookies to watch it.

### [Build responsive sections in seconds with VMIN ⭷](https://www.youtube.com/watch?v=UmSB0M58tP0&list=PLpjTM82q4Gu5HzMZtmQATTj8KAItmfHXw&index=5)

Video is blocked. Accept cookies to watch it.

---

<!-- source: https://finsweet.com/client-first/docs/beginners -->

SUPPORTING CONTENT

## Beginners in Webflow

Before learning Client-First, it's essential to have a base understanding of the web, classes, HTML, CSS, and Webflow as a platform.

### Learn the essentials before learning Client-First

A lot of Client-First will not be clear to someone with zero web background.

> We do not have to be pros. We do have to have a beginner-level knowledge of the web.

This page outlines the most important content to review before learning Client-First. After you understand the basics, Client-First becomes more clear and more powerful.

### Beginner web definitions

##### **No-code tools**

**‍**Tools that let us **[create things]** without code, which normally require code to create. No-code tools take some or all code out of the creation process.

##### **Webflow**

**‍**No-code tool for creating websites visually. Webflow takes most manually written HTML, CSS, and Javascript out of the website creation process. Instead of writing HTML, CSS, and Javascript (the core building blocks of the web), we can use these building blocks visually within Webflow Designer.

##### **Finsweet**‍

Leader in the Webflow ecosystem for agency work, content creation, tools, products, and resources.

##### **HTML (Hypertext Markup Language)**‍

The structure and content of the web page. If we were building a house, HTML is the house's materials. HTML creates the structure of the house.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/65735ae231ce6f85dc6713d7_element-panel.png)

##### **CSS (Cascading Style Sheets)**

**‍**The styles and layout of the web page. If we were building a house, CSS is the layout, floor plan, colors, and design decisions.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/65735ae231ce6f85dc6713da_style-panel.png)

##### JS (JavaScript)

The functionality of the web page. If we were building a house, JavaScript would be the refrigerator, air conditioning, and automatic car garage door.

![](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/65735ae231ce6f85dc67157d_javascript.png)

### Webflow University resources

##### [Webflow 101⭷](https://finsweet.info/webflow-101)

Learn many web principles and understand how Webflow works. Includes Intro to "HTML and Classes" and "Classes".

##### [Intro to HTML and CSS ⭷](https://finsweet.info/intro-to-html-css)

Learn how HTML and CSS work together to display our websites.

##### [Classes ⭷](https://finsweet.info/web-styling-using-classes)

Learn how classes give our website style.

### Join the community

##### Finsweet+ Account

[finsweet.com/plus](https://finsweet.com/plus)

##### No-code Twitter

‍[Follow Webflow](https://twitter.com/webflow) and [Follow Finsweet](https://twitter.com/thatsfinsweet), and explore 'no-code' hashtags like [#nocode](https://twitter.com/search?q=%23nocode) and [#webflow](https://twitter.com/search?q=%23webflow)

##### Official Webflow Facebook Group

‍[facebook.com/groups/webflowdesigners](https://www.facebook.com/groups/webflowdesigners)‍

##### Official Webflow Forum

‍[forum.webflow.com](https://forum.webflow.com/)

---

<!-- source: https://finsweet.com/client-first/docs/webflow-resources -->

SUPPORTING CONTENT

## Webflow resources

Our favorite Webflow resources to take your Webflow skills to the next level.

### Webflow resources

##### [Finsweet Extension for Webflow](https://chrome.google.com/webstore/detail/finsweet-extension-for-we/mjfibgdpclkaemogkfadpbdfoinnejep)

A suite of F'in sweet tools to improve your Webflow development experience

##### [Greenhouse + Webflow](https://finsweet.com/greenhouse)

Greenhouse integration with Webflow.

##### [Build a custom Webflow app](https://www.youtube.com/playlist?list=PLpjTM82q4Gu5bpuE-VBI565KkKHjfrYv-)

Learn how to build a Webflow app from scratch in this 3 video series with Alex Iglesias

##### [Reverse Proxies for Webflow sites](https://www.youtube.com/playlist?list=PLpjTM82q4Gu4OyupRClh2ayyWwEGHU-Bf)

Learn the basics about Reverse proxies, how to implement them, and how to fully set up your Webflow projects with Alex Iglesias.

##### [Barba.js - Transitions & Animations](https://www.youtube.com/playlist?list=PLpjTM82q4Gu4WTofz-QRvFxRoABXnde7F)

Learn the basics about Barba.js, how to create transitions between your website's pages, and how to create cool animations.

##### [Recreate Figma design in Webflow](https://www.youtube.com/playlist?list=PLpjTM82q4Gu4V3AoHYLZ6lWVPMzkYnopM)

Full 6 video site live build series with Sergey Stanchev.

##### [Webflow 201 by Web Bae](https://www.webbae.net/product/webflow-201)

Build production-grade Webflow sites that you can sell for real money

##### [Figma to Webflow plugin resources](https://www.youtube.com/playlist?list=PLpjTM82q4Gu73OPLYSSrvOXLIzl00EsDE)

3 video series testing the new plugin, showing how to avoid classes being auto-renamed when using the plugin, and introducing the Client-First Figma to Webflow kit.

##### [Attributes by Finsweet for Webflow](https://finsweet.com/attributes)

JavaScript functionality, without code.

##### [Wized basics](https://www.youtube.com/playlist?list=PL6A5t_af0ddfh735YGexxNUZ9ikqYmCC8)

Beginner Learning Path. Understand how web applications work, and use Wized to build your own web application.

##### [Wized advanced](https://www.youtube.com/playlist?list=PL6A5t_af0ddeXjHDUkfgFpWceuseiUEBO)

Advanced Learning Path. Understand how web applications work, and use Wized to build your own web application.

##### [HubSpot Forms in Webflow](https://youtu.be/aOl1f1LtLXo)

Learn the best way and most efficient approach for integrating HubSpot forms in Webflow

##### [Sales and Client Management tips](https://www.youtube.com/playlist?list=PLpjTM82q4Gu5XxEjHL_C0dvTN1Gqf8QeF)

Finsweet's sales process, tools, and how to manage client conflicts.

##### [Webdesign with AI](https://www.youtube.com/playlist?list=PLpjTM82q4Gu5wnVDzN6jAGxxYVY7JfMCL)

How to use AI in your Webdesign process. Matthis Garnier builds a website in Figma with ChatGPT and Midjourney.

### Finsweet+ community

Education-focused community of Webflow professionals.

Subscribe and get human Slack support on your Finsweet product implementations, access to our Community Forum for product support, information, and group chat. Plus, you'll get exclusive Attributes solutions, early access to new products, features, and more!

##### [All benefits](https://finsweet.com/community/plus)

---

<!-- source: https://finsweet.com/client-first/docs/changelog -->

SUPPORTING CONTENT

## Changelog

Key milestone version updates inside Client-First.

#### Version 2.1 - January 9, 2023

- New [Client-First V2.1 cloneable](https://finsweet.info/client-first-cloneable) project using color variables
- [Variables page](https://finsweet.com/client-first/docs/variables) added to the documentation
- [Global styles page](https://finsweet.com/client-first/docs/global-styles-embed) updated with new inherit CSS snippet
- [Utility class system page](https://finsweet.com/client-first/docs/utility-class-systems) updated with new aspect ratio classes
- [Core structure strategy page](#) updates with new core structure
- Visuals, illustrations, and screenshots updated to the new Webflow UI[‍](https://finsweet.com/client-first/docs/global-styles-embed)

#### Version 2.0 - August 26, 2022

[**Rebuilt docs**](https://finsweet.com/client-first/docs)

- All written documentation reorganized, refreshed, and rewritten for clarity
- Visuals, illustrations, and screenshots added to documentation pages
- Updated design to more minimalist simple style

[**Folders**](https://finsweet.com/client-first/docs/folders)

- Virtual organization tool to group and visually manage classes inside our Webflow project.
- Visualize a folder structure for our project's classes inside Webflow Designer by using the underscore character.

[**Utility class**](https://finsweet.com/client-first/docs/utility-class-systems) **system updates**

- Minor renaming of utility classes
- New utility class systems

[**New pages**](https://finsweet.com/client-first/docs/v1-to-v2) **with new content**

- New pages added to V2

[**New V2 cloneable**](https://finsweet.info/client-first-cloneable) **project**

- Starter project cloneable is updated with new utility classes and improved layout

> See [V1 to V2 guide](https://finsweet.com/client-first/docs/v1-to-v2) for updates overview

#### Version 1.2 - February 22, 2022

**Release of** [**Client-First Resources**](https://finsweet.com/client-first/resources)

- Feature curated projects built from Client-First community members
- Allow users to submit projects to be posted on the showcase
- Ongoing rollout of templates, resources, and education

#### Version 1.1 - December 25, 2021

**Release of** [**Fluid responsive**](https://finsweet.com/client-first/docs/fluid-responsive) **add-on**

- Use visual fluid responsive configurator to add responsiveness to your Webflow website
- Integration with [Finsweet Extension](https://www.finsweet.com/extension/)
- Ongoing rollout of templates, resources, and education

#### Version 1.0 - August 12, 2021

**Official public release of Client-First**

- Cloneable project v1.0
- [Documentation v1.0 (archived)](https://v1-client-first.webflow.io/)
- 5 Wireframes
- 3 Templates

---

<!-- source: https://finsweet.com/client-first/docs/board-of-directors -->

GET INVOLVED

## Board of Directors

The public community-focused Board of Directors to make decisions for all Client-First updates.

### About

This agreement outlines Finsweet’s initiative to create the Client-First Board of Directors voting system. Each Member of the Board is given votes based on their community impact in Client-First. Board of Director votes are used to determine all changes to the Client-First Style System for Webflow.

### Purpose

Currently, Finsweet manages all updates and decisions for Client-First.

Client-First is a product for the community. The Board of Directors initiative is an effort to make Client-First not only for the community, but also **by** the community.

The Board of Directors (the Board) is responsible for updates and decisions regarding Client-First. This includes, but is not limited to, roadmap guidance, versioning direction, class changes, and official cloneable updates.

All decisions must be made in the best interests of Webflow users.

In order to achieve this objective, it is essential that each Member of the Board has the ability to contribute to the decision-making process, and that their input is valued and taken into account.

The Board of Directors is created based on the most influential and focused teams that use Client-First to grow their business.

### Weighted Voting System

The Board of Directors follows a weighted voting system that is based on the Member’s influence on the Client-First ecosystem. The goal of this initiative is to ensure that the voting power of each Member is proportional to their community impact and contribution to Client-First.

Each Member of the Board of Directors is assigned a specific number of votes. These votes can be used when deciding new updates for Client-First.

The initial number of votes assigned to each Member of the founding Board of Directors is as follows:

- Finsweet: 5**\***
- Relume: 3**\***
- Finsweet+ Community: 1
- Relume Community: 1
- Client-First Translators: 1
- Twitter (Public): 1

**\***"Company Member" has the ability to initiate a “Vote Request”. These definitions are explained in the “Voting and Operating Procedures” section.

Companies can decide how to use their company vote power. For example, Finsweet’s 5 votes are a team-wide collective decision across 20 Webflow Developers. The decision of these 20 developers account for all 5 votes.

Companies who have community votes must follow the voting decision of their community. Community decisions cannot be overturned by the company. More information about public Airtable voting is available in “Voting and Operating Procedures”.

### Scaled Voting System

As the number of Members on the Board of Directors increases, it may become necessary to adjust the number of votes assigned to each Member in order to maintain the integrity of the weighted voting system.

Each Member's voting power remains proportional to their level of contribution to the ecosystem, while also ensuring that the system remains equitable and effective as Client-First continues to grow and evolve.

In order to achieve this, Finsweet may periodically review and adjust the Members of the Board of Directors, as well as the number of votes assigned to each Member.

Finsweet will manage the scaled voting adjustments based on their best judgement and dedicated fairness to the system. If at any point, Members of the Board feel that Finsweet’s decision to adjust the Members or weighted votes is not fair, the Board of Directors can request a vote to decline Finsweet’s decision.

### Voting and Operating Procedures

- **Vote Request.** A request to vote on a change to Client-First Style System. Only Company Members have Vote Request power.
- **Company Member.** A Member of the Board of Directors that is considered a "company", "organization", or "entity" that uses Client-First for primary business operation.
- **Clear single voting objective.** A Vote Request must be for (1) topic vote — For example, a vote to update classes in the spacing system. A Vote Request can not bundle multiple topics — For example, a vote to update spacing, typography, and core structure.**‍**

- **Vote Request explanation requirement.** When a company Member initiates a Vote Request, the Member must provide a public view-only Google Doc containing (2) types of explanation informing Members about their Vote Request. This Google Doc will be sent directly to Members of the Board of Directors, as well as shared publicly on community channels and Twitter. The explanations must provide sufficient information to help voters make an informed decision.  
  - Explanation 1: Clearly written explanation of the proposed change and available voting options.  
  - Explanation 2: Screen recorded video visually showing and explaining the proposed change and available voting options. The maximum video duration is 5 minutes.
- **No suggestive voting options.** When explaining available voting options, it is required to maintain a neutral point of view for all available options. It is prohibited to clearly favor a voting option to encourage others to vote for it. Options must be presented with equal weight, clear facts, and no bias or favoritism toward any option. This policy encourages fair and unbiased voting based on facts rather than sales tactics.**‍**
- **Initiative a vote.** A Vote Request is the only way to initiate a Board of Directors vote. There are no scheduled or recurring voting unless explicitly requested through a Vote Request.
- **Submit a Vote Request.** Vote Requests must be sent to Eve Kayser (Finsweet) and Victoria Perez (Finsweet). Send your Vote Request to eve.kayser@finsweet.com, victoria.perez@finsweet.com
- **Vote timeline.** Board of Directors must vote on active Vote Requests within (1) week. Failure to place a vote within (1) week forfeits your ability to vote on the topic. Public voting through Twitter Polls is open for (1) week.**‍**
- **Vote Request frequency.** A Member can only use (1) Vote Request per yearly calendar quarter. For example, (1) request can be made between Jan-Mar, an additional (1) between Apr-Jun, an additional (1) between July-Sept, and an additional (1) between Oct-Dec.**‍**
- **Vote Request for Global Embed improvements.** A Vote Request is not required for CSS improvements inside the Global Embed. For example, if browsers now support a more efficient and widely supported CSS snippet for an existing Global Embed class, this change can be made without a Vote Request. "Implementation of Updates" procedures must be followed with any change to the Global Embed. This Vote Request override rule does not apply to new classes or implementation concepts within the Global Embed.**‍**
- **No meetings.** There are no scheduled or recurring Client-First Board of Directors meetings.**‍**
- **Async communication in Slack.** All discussions and voting take place asynchronously through text communication and screen recordings.**‍**
- **Transparent voting results.** Voting results are always accessible for all Board of Directors Members. No Board Member voting results can be made private. A third-party application, Airtable, is used to display all votes from Board Members. This Airtable database will be publicly accessible. Finsweet manages Airtable form creation, management, and account subscription of the account.
- **Community voting.** When a Vote Request is initiated, Company Members that manage community votes must collect votes through "emoji voting" inside their community channel. For example, Finsweet will post in the Finsweet Community Slack about the Vote Request, and prompt their community members to use an emoji on the message to submit their vote. This process will help prevent a user from submitting multiple votes. After (1) week, the option with the most emojis represents the community vote. Twitter (Public) community vote is handled through Twitter Polls.

### Implementation of Updates

There is a (1) month timeframe between a Board approved Client-First change and the public implementation of the change.

During this (1) month timeframe, all parties who are affected by the changes have the opportunity to properly implement the changes and make any necessary adjustments to their products, tools, content, and resources.

Vote Request outcomes are shared immediately with all Board of Directors, as well as the public community. However, the public-facing implementation of these updates must be made no sooner than (1) month.

Members of the Board of Directors agree to not implement their changes before the (1) month timeframe.

This implementation period is critical to ensure all updates and changes are properly integrated into a Member’s products, tools, content, and resources.

### Requirements to be considered for Client-First Board of Directors

- Product, tool, or content is mostly or completely focused in the use of Client-First.

- **1,000+ active users** (SaaS product, Chrome Extension, or similar). Users do not have to be paid, but users must be **active —** as in  1,000 users are using the product month after month, for a minimum of 3 months, confirmed by analytics.

- **1,000+ active community members** on one platform (Slack, Discord, Circle, or similar). The community channel must be active on a daily basis with conversations around product use and/or Client-First.

- **5,000+ clones of one Webflow project** that directly promotes the use of Client-First.

When the threshold of **active users**, **community members**, and **project clones** is met, the Board of Directors will decide if the potential Member is considered "mostly or completely focused in the use of Client-First". If the project is not mostly focused in Client-First and has other priorities, the potential Member may be declined from joining the Board of Directors.

It is required for all Company Members to maintain these accomplishments. For example, if a Company Member loses interest in Client-First and no longer maintains an active community or product, the Board can vote to remove the Company Member from the Board.

These requirements are subject to change as the community grows. Finsweet will make adjustments to these requirements based on their best judgement and dedicated fairness to the system. If at any point, Members of the Board feel that Finsweet’s decision to adjust the requirements is not fair, the Board of Directors can request a vote to decline Finsweet’s decision.

If you are interested in joining the Board of Directors, please reach out to a Company Member as soon as possible to express your interest.

### Attribution Requirement

One goal of the Board of Directors is to bring unity to Client-First across all product providers. This includes unity of cloneable projects, style guides, stylesheets, and marketing material.

Company Members must clearly attribute Client-First on the homepage of the Member's marketing website. It must be clear that the product, tool, or content uses Client-First.

Company Members may use their own proprietary style guide, which may be different from the default Finsweet Client-First style guide project.

If a Member company decides to use their own style guide, the Member must make a visible Client-First attribution. Text attribution must be clear an placed above the fold of the style guide.

Attribution content:

- This style guide is based on [Client-First](https://finsweet.com/client-first) and is a fork of the [Client-First cloneable project](https://webflow.com/made-in-webflow/website/client-first-cloneable).

The goal of this is to help the community understand that we are all part of the same family.

### Conclusion

The Client-First Board of Directors is an important step towards making Client-First a truly community-driven product.

We can ensure the continued evolution and growth of Client-First benefits the entire Webflow community by giving each Board Member a voice in decision-making.

With this agreement in place, we can look forward to a future of collaboration, innovation, and transparency.

Let's work together to make Client-First the best it can be.

---

<!-- source: https://finsweet.com/client-first/docs/become-a-translator -->

GET INVOLVED

## Become a Translator

Help thousands of Webflow users better understand Client-First in their native language by becoming a Client-First translator.

### The initiative

It is our goal at Finsweet to spread Client-First Style System to as many people in the Webflow community as possible. If a person is searching for a process to build in Webflow, we want to help that person.

We can produce high-quality information that's valuable to Webflow developers. We can make release educational resources like tutorials, live streams, and bootcamps.

This is effective if the audience knows English well.

**Imagine someone who learns about Webflow and becomes motivated to grow a business around Webflow—But they’re constantly blocked from learning due to the language barrier.**

There must be something done about the lack of resources in non-English.

That’s why we went on a mission to translate Client-First into as many languages as we can.

### The solution

#### Translate the Client-First docs to teach more people

With more languages supported in Client-First, we can expand the system to more users.

We can help people learn Webflow and Client-First in their native language.

This is your opportunity to create the translated documentation for your native language. If this sounds interesting to you, keep reading.

### "Become a Client-First Translator" campaign

It all started with this Twitter post:

![Twitter post from @joekrug asking who is interested in Client-first language translation](https://cdn.prod.website-files.com/65735ae231ce6f85dc671354/65735ae231ce6f85dc6716ca_6294fb79dc55b491dbba222b_Screen%2520Shot%25202022-05-30%2520at%252012.14.11%2520PM.png)

We had an excellent response to this tweet. Over 20 people across 12 languages have sent a DM about becoming a translator.

Our first batch of translated languages went really well. See the list of LIVE and COMING SOON languages in the "Languages" dropdown of the main nav.

### Benefits of being an official translator

#### Powerful advertisement

Your personal name or agency name will be featured on top of each translated page you create. It will include a direct link to your portfolio or company website. **Your translated pages will be published to the Finsweet.com/client-first/ primary domain name.** This is an excellent advertisement and backlink opportunity from a very high performing project. It is made very clear that you manage the [Language] translated content.

#### Impress leads and clients

If you are using Client-First for your projects, and you use Client-First in your pitch, this is an excellent opportunity to tell the lead that you manage the [Language] translated content. Imagine selling a website in Spain and telling that company that you are the manager of all Spanish translated content. This immediately presents you as a professional.

#### Grow a community

If you are interested in growing a community in your country, being a language translator is an ideal opportunity. People from your country will find the Client-First docs in your local language, find you as the translator, and be more inclined to join your community (or group of online friends!). You can be a community all-star by sharing your translated content to new and current Webflow users.

#### Become part of the Client-First Board of Directors

As a Client-First translator, you have voting power for all Client-First updates. All updates, changes, and improvements made to Client-First must go through a formal voting process by the [Client-First Board of Directors](https://finsweet.com/client-first/docs/board-of-directors). All translators collectively have (1) vote. As a translator, your vote will be counted and represented in all Client-First decisions.

#### We will market you

We are going to make sure you get the proper name recognition for your work. We want these docs to give you visibility in the community. We want to regularly shout out translators on live streams, events, and Client-First marketing. When your translation launches, we will feature your work in the Finsweet newsletter. Our goal is for your hard work to benefit you and your career significantly.

#### Private Client-First Slack channel

You will be invited to the Client-First translators Slack channel. Meet the other motivated translators and be the first to know what's happening with Client-First.

#### Help people

Let's take a step back and forget the business benefits.

This will help people. Your translated content can be the difference between someone using Webflow and not using Webflow. Imagine how many people start using Webflow and stop because they don't know how to organize and manage Designer. You can be the difference. Someone can change their career path because your content enabled them.

### Project specs

#### Important points

- This is not an invitation to join Finsweet. All translators operate separately from Finsweet.
- You will not be paid in money for this job. Your benefit is advertisements, marketing, education, name recognition, and more as covered in the benefits section.
- You do not need to be a super pro in Webflow or Client-First to be a translator. You need to have a base-level understanding of Webflow and Client-First + be super motivated.

#### Minimum expectations

You do not have to translate all of the docs. You can do this, and we would like you to do this, but this is not a requirement.

We will require you to translate

- "Intro" page
- Each page inside the "Concepts" category of the left sidebar
- "Fluid responsive" page

There's a total of 12 required pages.

We believe the 12 required pages are the minimum information someone needs to be proficient level in Client-First.

However, the more pages you translate, the better experience your native readers will get. We will be happy if you decide to translate all pages of the docs.

##### Adding your own content:

You can add your own content to help people understand Client-First.

For example, you may want to release videos, cloneables, or supporting content in your language. This is allowed and recommended.

If your additional content is accurate Client-First information, and it will help your reader better understand Client-First, it will be accepted.

#### Managing and making updates

After your translated pages are launched, we will ask you to make content updates a few times each year.

If an update is large, and the documentation must reflect that update, we will ask you to make updates to your translated pages.

For example, if *spacer-* classes are added to the docs, we will make these updates in the English version. This update is best made across all languages, as it's a very important update to spacing in Client-First.

These types of changes happen a few times per year. You will have 30 days to implement any changes to the English docs.

If this is a problem, please mention it when you email Victoria.

#### Working with other people

Working in teams is accepted! We will accept a maximum of 2 people/agencies listed as authors of a page.

For example, you can team up with another agency or another person to co-manage the translated content.

If you are interested in working alone, please say that in your email.

If you are interested in working with someone else, please say that in your email.

### Motivated translators

This section is super important. Please read and understand it in full.

We need to have motivated and passionate translators. This is crucial for the translation initiative.

Before you move forward with this, please be real with yourself. Be 100% sure that this is what you want to do.

#### Do not start and then stop

**Do not do this:**

Move forward as a translator, do 20% of the work, and then leave/disappear/give an excuse.

This is the worst thing you can do.

This wastes your time. This wastes our time and resources at Finsweet.

There is no reason to do this.

If you think there is a chance you will leave in the middle of the initiative, don't move forward.

We want people who are motivated and passionate about taking this from 0% to 100%.

If that's not possible for you, for any reason (client work, family, kids, anything), just don't move forward.

Be honest and true with yourself!

If you're in, we're in!

### Interested in moving forward?

##### Please add this information to your email:

- Name
- Language you want to manage
- Are you representing an individual or agency name?
- Do you want to work alone or with someone else?
- Share your past work. Please send 3 Webflow read-only links. At least 1 must be full Client-First build.
- If you have any writing samples, please share them. English and/or your preferred language is accepted.
- Why do you want to do this? What is your personal biggest benefit?

---

<!-- source: https://finsweet.com/client-first/docs/global-styles-embed -->

SUPPORTING CONTENT

## Global Styles embed

Explanation of each CSS snippet in the Global Styles embed of the Client-First cloneable.

### CSS snippets

#### Text clarity

Modifies default browser rendering method for better text clarity.

```
<style>
  /* Make text look crisper and more legible in all browsers */
  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
</style>
```

Text looks better on the page with this snippet.

#### Focus state for keyboard interaction

Creates a unified "selected effect" for all focusable elements in the build at once.

```
<style>
  /* Focus state style for keyboard navigation for the focusable elements */
  *[tabindex]:focus-visible,
  input[type="file"]:focus-visible {
   outline: 0.125rem solid var(--base-color-system--focus-state);
   outline-offset: 0.125rem;
}
</style>
```

It uses a tabindex attribute to target all focusable elements.

Webflow allows us to style focus-visible state (called "Focused (keyboard)" in the states dropdown) for any element separately. Use it if you want to override the default style we created  with the snippet.

#### Rich Text top margin removal

Removes top margin from the first element in Rich Text.

```
<style>
  /* Get rid of top margin on first element in any rich text element */
  .w-richtext > :not(div):first-child,
  .w-richtext > div:first-child > :first-child {
    margin-top: 0 !important;
  }
</style>
```

For example, we want our H2 to have margin-top: 4rem. This is the top margin we want throughout the entire Rich Text element. However, we do not want this margin-top for the first element of the Rich Text. The 4rem of margin creates an unwanted space between the top of the Rich Text element and the first H2 text.

The "not" declaration is a special failsafe for our Table of Content Attribute solution.

#### Rich Text bottom margin removal

Removes bottom margin for the last element in Rich Text.

```
<style>
  /* Get rid of bottom margin on last element in any rich text element */
  .w-richtext>:last-child, .w-richtext ol li:last-child, .w-richtext ul li:last-child {
    margin-bottom: 0;
  }
</style>
```

For example, we want our Paragraph to have margin-bottom: 0.5rem. This is the bottom margin we want throughout the entire Rich Text element. However, we do not want this margin-bottom for the last element of the Rich Text. The 0.5rem of margin creates an unwanted space between the bottom of the Rich Text element and the final Paragraph text.

#### Container centerizer

Forces horizontal centering of all *container-* classes.

```
<style>
  /* Make sure containers never lose their center alignment */
  .container-medium,
  .container-small,
  .container-large {
    margin-right: auto !important;
    margin-left: auto !important;
  }
</style>
```

We always want to maintain margin-left and margin-right set to auto. If we, another developer, or our client make an accidental margin change, the auto value will remain through !important tags.

#### Inherited styles for various Webflow elements

Removes some hardcoded styles and sizes from default Webflow elements.

```
<style>
 /* These classes are never overwritten */
.hide {
  display: none !important;
}

@media screen and (max-width: 991px) {
    .hide, .hide-tablet {
        display: none !important;
    }
}
  @media screen and (max-width: 767px) {
    .hide-mobile-landscape{
      display: none !important;
    }
}
  @media screen and (max-width: 479px) {
    .hide-mobile{
      display: none !important;
    }
}
 
.margin-0 {
  margin: 0rem !important;
}
  
.padding-0 {
  padding: 0rem !important;
}

.spacing-clean {
padding: 0rem !important;
margin: 0rem !important;
}

.margin-top {
  margin-right: 0rem !important;
  margin-bottom: 0rem !important;
  margin-left: 0rem !important;
}

.padding-top {
  padding-right: 0rem !important;
  padding-bottom: 0rem !important;
  padding-left: 0rem !important;
}
  
.margin-right {
  margin-top: 0rem !important;
  margin-bottom: 0rem !important;
  margin-left: 0rem !important;
}

.padding-right {
  padding-top: 0rem !important;
  padding-bottom: 0rem !important;
  padding-left: 0rem !important;
}

.margin-bottom {
  margin-top: 0rem !important;
  margin-right: 0rem !important;
  margin-left: 0rem !important;
}

.padding-bottom {
  padding-top: 0rem !important;
  padding-right: 0rem !important;
  padding-left: 0rem !important;
}

.margin-left {
  margin-top: 0rem !important;
  margin-right: 0rem !important;
  margin-bottom: 0rem !important;
}
  
.padding-left {
  padding-top: 0rem !important;
  padding-right: 0rem !important;
  padding-bottom: 0rem !important;
}
  
.margin-horizontal {
  margin-top: 0rem !important;
  margin-bottom: 0rem !important;
}

.padding-horizontal {
  padding-top: 0rem !important;
  padding-bottom: 0rem !important;
}

.margin-vertical {
  margin-right: 0rem !important;
  margin-left: 0rem !important;
}
  
.padding-vertical {
  padding-right: 0rem !important;
  padding-left: 0rem !important;
}
</style>
```

###### By default, this style is "turned off" (commented out) in the Client-First cloneable. You must manually turn it on if you wish to use it.

This snippet makes styling for some Webflow elements easier. Instead of manually overriding hardcoded styles, we can inherit the styles from the parent.

For example, Webflow form inputs never follow the body font-size. This is because form inputs are hardcoded to be 14px. We must apply a class to the input and declare a font-size. With this snippet, the form inputs do not use 14px and instead inherit the body font-size.

Why is this snippet disabled by default? We consider this an advanced option because it can lead to unexpected behavior. For example, we won't be able to select "All links" and change their color. The "All links" style update won't change anything because we are no longer working with hardcoded values set to these elements. We override this option by using inherit.

#### Inherit color from parent element

Client-First includes a ***inherit-color*** utility class to override the style and inherit from the parent element.

```
<style>
 /* Set color style to inherit */
.inherit-color * {
    color: inherit;
}
</style>
```

#### !important declarations

Prevents [CSS specificity](https://finsweet.com/client-first/docs/css-specificity) issues for our display, padding, and margin utility classes.

```
<style>
  /* These classes are never overwritten */
  .hide {
    display: none !important;
  }

  @media screen and (max-width: 991px) {
    .hide {
      display: none !important;
    }
    .hide-tablet {
      display: none !important;
    }
  }

  @media screen and (max-width: 767px) {
    .hide {
      display: none !important;
    }
    .hide-tablet {
      display: none !important;
    }
    .hide-mobile-landscape {
      display: none !important;
    }
  }

  @media screen and (max-width: 479px) {
    .hide {
      display: none !important;
    }
    .hide-tablet {
      display: none !important;
    }
    .hide-mobile-landscape {
      display: none !important;
    }
    .hide-mobile {
      display: none !important;
    }
  }

  .margin-0 {
    margin: 0rem !important;
  }
  .padding-0 {
    padding: 0rem !important;
  }
  .margin-top {
    margin-right: 0rem !important;
    margin-bottom: 0rem !important;
    margin-left: 0rem !important;
  }
  .padding-top {
    padding-right: 0rem !important;
    padding-bottom: 0rem !important;
    padding-left: 0rem !important;
  }
  .margin-right {
    margin-top: 0rem !important;
    margin-bottom: 0rem !important;
    margin-left: 0rem !important;
  }
  .padding-right {
    padding-top: 0rem !important;
    padding-bottom: 0rem !important;
    padding-left: 0rem !important;
  }
  .margin-bottom {
    margin-top: 0rem !important;
    margin-right: 0rem !important;
    margin-left: 0rem !important;
  }
  .padding-bottom {
    padding-top: 0rem !important;
    padding-right: 0rem !important;
    padding-left: 0rem !important;
  }
  .margin-left {
    margin-top: 0rem !important;
    margin-right: 0rem !important;
    margin-bottom: 0rem !important;
  }
  .padding-left {
    padding-top: 0rem !important;
    padding-right: 0rem !important;
    padding-bottom: 0rem !important;
  }
  .margin-horizontal {
    margin-top: 0rem !important;
    margin-bottom: 0rem !important;
  }
  .padding-horizontal {
    padding-top: 0rem !important;
    padding-bottom: 0rem !important;
  }
  .margin-vertical {
    margin-right: 0rem !important;
    margin-left: 0rem !important;
  }
  .padding-vertical {
    padding-right: 0rem !important;
    padding-left: 0rem !important;
  }
</style>
```

This snippet ensures our utility classes always have their CSS properties as we intended. The !important tags force the utility classes to maintain their global style controls.

---

<!-- source: https://finsweet.com/client-first/docs/v1-to-v2 -->

GETTING STARTED

## V1 to V2 guide

Essential updates in Client-First V2.

### V2 updates

#### Everything is explained more clearly in V2

> We introduce the [Topic] strategy approach.

The most significant update to Client-First V2 is how we explain Client-First concepts. V1 lacked organization of content and clear explanation for some topics.

V2 introduces a new content organization method to help us better understand Client-First. Each topic has a more precise explanation.

The more essential topics are organized as "strategies" —

- ‍[Classes strategy](https://finsweet.com/client-first/docs/classes-strategy-1)
- [Core Structure strategy](https://finsweet.com/client-first/docs/core-structure-strategy)
- [Typography strategy](https://finsweet.com/client-first/docs/typography-strategy)
- ‍[Spacing strategy](https://finsweet.com/client-first/docs/spacing-strategy)
- [and more](https://finsweet.com/client-first/docs)

#### Folders

Folders will redefine how we visualize classes inside our Webflow project.

Client-First folders will allow us to organize classes in a flexible folder structure.

Use the underscore character to create a custom folder. Organize utility classes by dashes only.

Folders will only work with Client-First + [Finsweet Extension](https://finsweet.com/extension). Learn more in [Folders](https://finsweet.com/client-first/docs/folders).

#### Components are better defined

In V2, we will be more specific when we are using components — and more specific when using underscores!

**V1 Initial release  
‍**underscore in class name = component

**V2 release with Folders  
‍**underscore in class name = folder   
[folder-name]\_component = component

Using an underscore in the class name does not necessarily mean the folder is a component. We now use underscores for organization or groupings of elements in Folders.

Components now have a specific classification. If we want an element to be considered a component, we use the word **"component"** for the element identifier.

Learn more in [Folders strategy](https://finsweet.com/client-first/docs/folders-strategy).

#### Class types are better defined

Custom class, utility class, global class, combo class are better defined and explained in [Classes strategy 1](https://finsweet.com/client-first/docs/classes-strategy-1).

By better understanding class types, we can make better decisions while building.

#### *page-padding* is now *padding-global*

Our project's most important padding value is now called *padding-global*. This name change results in better organization of our folder system.

Instead of putting our padding class in the *page-* folder, we put it in the *padding-* folder.

Learn more in [Core Structure strategy](https://finsweet.com/client-first/docs/core-structure-strategy).

#### *section-[identifier]* is now *section\_[identifier]*

Section classes now use the underscore character instead of the dash.

Our new Folder update assures that Utility classes are the only classes that use dashes. Custom classes use underscore. Section classes are classified as "custom classes", which means they need an underscore in the class name.

The underscore places the "section classes" inside one custom class folder — *section\_*.

All section classes will be in the section folder. Learn more in [Core Structure strategy](https://finsweet.com/client-first/docs/core-structure-strategy).

#### New *padding-section-[size]* establishes global section padding

We have added a new utility class system to manage global spacing across sections. This spacing system update aims to limit the number of spacing options we have for sections + keep them unified across the entire project.

Learn more in [Core Structure strategy](https://finsweet.com/client-first/docs/core-structure-strategy).

#### New *heading-style-[h#]* maintains unified Heading styles

When the styles of a Heading tag need to display as a different Heading tag, we can use our *heading-style-[h#]* class.

For example, if we need an H2 for SEO purposes, but the text should follow the styles of H3, we can apply *heading-style-h3* to the H2 to change its style while maintaining the proper semantic HTML tag.

Learn more in [Typography strategy](https://finsweet.com/client-first/docs/typography-strategy).

#### New *display-inlineflex* utility classes

Apply CSS property display: inline-flex, which is not a supported CSS property in Webflow.

###### **Use case:** Using the CSS property display: flex is usually important in our project. However, display: flex causes elements to take up 100% of the space by default. This makes it difficult to use flexbox for buttons. display: inline-flex allows elements to behave as inline, while maintaining flex capabilities inside them.

Learn more in [Utility class systems.](https://finsweet.com/client-first/docs/utility-class-systems)

#### Removed *show-* utility classes

Removed *show-* utility classes. Show classes applied display: block at different responsive levels.

We found that *show-* classes were very limiting, only worked for a small amount of use cases, and may lead to unwanted responsive issues.

Instead of applying "show" classes to elements, we can apply display properties directly to the custom class.

Additionally, we can apply any display properties to a combo class. For example, *modal\_component* *is-visible-tablet*.

#### New strategies for spacing

V2 expands on how we can use utility classes and custom classes to space elements throughout the project. We have added new methods for implementing spacing.

**Spacing with utility class system**

- Spacing wrappers (V1)
- Spacing blocks (new in V2)

**Spacing with custom classes**

- On the element (V1)
- CSS Grid on the parent (new in V2)

#### Improved custom CSS in Global Styles embed

There is a full overview of each CSS snippet included on the [Global Styles embed page](https://finsweet.com/client-first/docs/global-styles-embed).

#### Totally new pages in V2

V2 adds new content pages for topics not covered in V1

- [Intro](https://finsweet.com/client-first/docs/intro) outlines the most important topics of Client-First.
- [Learning path](https://finsweet.com/client-first/docs/learning-path) gives us a 7-day path to learning Client-First.
- [Big docs](https://finsweet.com/client-first/docs/big-docs) helps motivate us to learn Client-First in full.
- [Folders](https://finsweet.com/client-first/docs/folders) and [Folders strategy](https://finsweet.com/client-first/docs/folders-strategy) gives us a full explanation into our new class visualization method.
- [Semantic HTML tags](https://finsweet.com/client-first/docs/semantic-html-tags) gives us a better understand of how to properly build in HTML.
- [CSS Specificity](https://finsweet.com/client-first/docs/css-specificity) gives us an explanation into why margin and padding classes don't work when you copy and paste elements and components.
- [Global embed](https://finsweet.com/client-first/docs/global-styles-embed) helps us understand the purpose of the custom CSS added to the Client-First cloneable.
- [Sales strategy](https://finsweet.com/client-first/docs/sales-strategy) gives us methods to use Client-First in our sales process to win more projects.
- [Convert past projects](https://finsweet.com/client-first/docs/convert-past-projects) gives us information about converting past projects to Client-First.

#### From Client-first to Client-First

Finsweet recently released a new logo. This logo replaces the lowercase "f" to an uppercase "F".

We will follow the same trend for Client-First.

Client-first V1 features a lowercase "f". In V2, we formalize the capital F across the brand. This update changes Client-first to Client-First.

Interested in Finsweet's move from f to F? Watch our live stream [here](https://www.youtube.com/watch?v=jkyTCXmBFCM).

padding-section-small

padding-section-medium

padding-section-large

### Heading

### Heading

### Heading

### Heading

### Heading

### Heading

display-inlineflex
