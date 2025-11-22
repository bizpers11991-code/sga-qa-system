# Task: pdf_system

**Worker:** qwen
**Generated:** 2025-11-21T22:36:24.358665

---

<think>
Alright, I need to create a PDF generation system for the SGA QA application using the @react-pdf/renderer library. Let me start by breaking down the requirements and figuring out how each part can be implemented.

First, the header needs the company logo on the top-left and the document title centered. The footer has three columns with specific content. Also, there's a watermark for each page. The SgaPdfDocument component will be the main wrapper, so I should structure it with Header, body, and Footer.

Let me recall how @react-pdf/renderer works. It's like using React components, but the components are defined using their library's elements. So I need to import View, Text, Image, etc., from @react-pdf/renderer.

For the Header component (SgaPdfHeader), I need to position the logo on left and title centered. Since it's a flexbox-based system, I can use flexDirection: 'row' and justifyContent: 'space-between' but also align the title in the center. Maybe split into left, center, right parts. Wait, maybe a flexbox with left (logo) and the title is centered. Hmm, perhaps a single row with the logo on the left and title using flexGrow in the middle to push it to center.

But wait, how to center a text in a row layout? Maybe the title should be in a centered div with absolute positioning? Alternatively, use flex with space-between to push logo to left and have the title take up the middle. Alternatively, maybe the header is a View with flex-direction: 'row', with logo on left and title on the right? No, title should be centered independently. Hmm, maybe the title is another View that takes up the full width and centers itself vertically? Wait, since the header is the top of the page, maybe it's a row with two parts: a left section with logo and a center section. But how to arrange two elements in a row with one on left and the other centered?

Wait, maybe the header is a container with flex-direction: 'row', and the logo is in a left section. The title can be in another View that uses justifyContent: 'center' and alignItems: 'center', and takes up the remaining space. But how to make sure the title is centered horizontally. Maybe split into two parts: left (logo) and the rest of the space (centered title). Hmm, perhaps the header is actually a flex layout. Let me think in CSS terms. The header should have two parts, a left and a middle. Wait, maybe the logo is on the left, then the title is centered. That could be achieved using a flexbox row with the logo positioned to the left and the title in a View with margin-left: auto and margin-right: auto. In React PDF terms, that would be justifyContent as 'space-between' but with the title in between. Alternatively, a flex-row with left (logo), and center (title). But how to achieve that.

Alternatively, maybe the logo is a fixed width on the left, and the title is centered. So the header could be a flex row with the logo on the left and the title taking the remaining space with justifyContent: 'center'. Hmm, perhaps the header is as follows:

<Header>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
    <Image src={logo} style={{ maxHeight: '30px' }} /> 
    <Text style={{ ... }}>{documentTitle}</Text>
  </View>
</Header>

But then, the title would be pushed to the right. But the requirement is for the title to be centered. So maybe the logo is one View, and then the title is another View that's centered in the remaining space. Alternatively, maybe the title is in a View that's flex 1 and center. 

Wait, maybe using absolute positioning. The header could have a View with position: 'absolute', left: 50%, right: 50%, translateX to center the title. But that might complicate things. Alternatively, have a flex container where the title is centered by having flex 1 and center attributes. Let me think. The logo is on the left, title is in the middle. So the header is a row with two elements: logo and title. To make the title centered, perhaps the logo is not in a flex layout. Hmm, maybe the logo is on the left, and the title is a separate element that takes up the rest of the space and is centered. Wait, but how to do that. Maybe using a flexbox row where the logo is in one View, and the title is in another View wrapped in a centerX. Let me try this approach in code:

For the header, within a View (header style), have two Views inside with flexDirection 'row', one on the left for the logo, and another one that uses justifyContent: 'center' and spans the rest of the width. But how to distribute the space. Maybe give the logo View a fixed width, and the title container takes flex 1. Or perhaps the logo is on the left and the title is in a flex container with flexGrow:1, justifyContent: 'center'. 

Okay, I'll structure the header as follows. The SgaPdfHeader component will take the logo and the title as props. The header is a flex row, with a left section (logo) and a right section (title). Wait, no, the title needs to be centered. So perhaps the layout is split into left and center. Wait, maybe the header is a single row with several items. Let's just use a flex-row and apply justifyContent as 'center' for the title. But how to have the title centered in the entire header space. 

Alternatively, maybe the header is a single View that is a flexbox column (since we need to center vertically and horizontally?), but in this case, it's just the top of the header. Hmm.

Maybe the logo is on the left, and then the title is centered. To achieve that, perhaps the logo is in a View with position: 'absolute' and left: 0, while the title is in a View with justifyContent: 'center' and takes the full width. That could work. Let me think about the code:

In SgaPdfHeader:

<View style={{ position: 'relative' }}>
  <View style={{ position: 'absolute', left: 0, top: 0 }}>
    <Image source={logo} />
  </View>
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>{documentTitle}</Text>
  </View>
</View>

But maybe that's overcomplicating. Alternatively, just use flexDirection: 'row' and justifyContent: 'space-between', but have the title in the middle. To have the title centered, perhaps wrap it in a View with text align center. Alternatively, split the header into two parts: left for logo and right for title, but that would not center the title. Hmm. Maybe the title is another View in the row with margin-left and margin-right set to auto. Like in CSS, to center an element in a flexbox, we can set margin: 0 auto. But in React PDFerator, how to do that. Maybe use alignSelf: 'center' or justifyContent: 'center' in the View that contains the title. But in the row, the elements are laid out horizontally. For a row, justifyContent: 'center' centers all elements. But if there are multiple elements, it's more complex. 

Let me try an example. Let's have a flex row with two Views: the logo on the left and the title in the center. Wait, maybe the logo and the title are in separate Views within the same row, but the title's View uses margin-left auto to push it to the right. But that would put the title on the right. No. Hmm. Alternatively, the first element is the logo, the second element is the title. If between them, we use flexGrow on the left element, but I'm not sure. Alternatively, the logo is left, the title is center, but that requires three elements. For example:

<View style={{ flexDirection: 'row' }}>
  <Image source={logo} /> 
  <View style={{ flex: 1, justifyContent: 'center' }}>
    <Text>{title}</Text>
  </View>
</View>

This way, the Image is on the left, and the title takes the rest of the space and is centered vertically. But how to ensure the title is horizontally centered. Because if flex:1 is given, the View takes the remaining space. Then, within that View, we apply justifyContent: 'center' and alignItems: 'center' to center it both horizontally and vertically. Wait, the View's content (the Text) is in the center of that View, which is taking the remaining width. But the View is on the right of the logo, so the title will be centered in the remaining area to the right of the logo. So if the logo is, say, 50px, then the title is centered in the area from 50px to the end. That's probably what we need here. So the header will have the logo on the left and the title centered in the remaining space.

So the code for SgaPdfHeader would be:

<View style={{ flexDirection: 'row' }}>
  <Image src={logo} style={{ maxWidth: '100px' }} />
  <View style={{ flex: 1, justifyContent: 'center', padding: '10px' }}>
    <Text style={{ textAlign: 'center' }}>{documentTitle}</Text>
  </View>
</View>

Wait, but in this setup, the title is in a View that takes up the remaining space, and the text is centered in that View. That would center the title to the center of the remaining space. However, the documentTitle is in a Text component with textAlign: 'center', which should work.

I think this would suffice. The logo on the left, then a View that takes the remaining space, centers the title both vertically and horizontally. If the logo is a fixed height, such as 30px or 40px, then the View will just have the title vertically aligned with the logo. If logo is a bigger height, maybe adjust padding.

Now, the footer has three columns: left, center, right. The left column has Document ID and version. The center has a fixed text, and the right has page number X of Y. For the footer, using a flex-row with three flex-1 sections. Each section is a View with padding or margin. For example:

<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
  <View>
    <Text>Document ID: {documentId}</Text>
    <Text>Version: {version}</Text>
  </View>
  <View>
    <Text>Printed copies are uncontrolled documents</Text>
  </View>
  <View>
    <Text>Page {pageNumber} of {numberOfPages}</Text>
  </View>
</View>

But the page number part needs to use the built-in functions from @react-pdf/renderer. The Document component has a prop that can access the page context. Wait, the page number can be accessed via a function that receives pageNumber and totalPages. So the SgaPdfFooter component needs to receive those as props. Therefore, in the footer component, the right section would be:

<Page pageNumber={pageNumber} totalPages={totalPages} />

Wait, no, in @react-pdf/renderer, to get the page number, you need to create a custom element. The way it's done is by using a <Page /> component inside the footer. However, the page numbers are provided by the library's context. Alternatively, the footer receives the current page number as a prop when using the pageContext. Hmm, maybe I need to create the footer as a function that uses the page Context. Wait, looking up the docs:

To get page numbers in the footer, you can use the <Text> page {pageNumber} of {numberOfPages} </Text> inside the footer. Wait, but how to pass those variables. The way the React-PDF library does this is by providing 'pageNumber' and 'numberOfPages' as props when using the <Document>. So the footer component can accept those props. Wait, the example from the library's docs:

import { Document, Page, View, Text } from '@react-pdf/renderer';

const pdf = (
  <Document>
    <Page size="A4">
      <View style={{position: 'absolute', bottom: 8, right: 8, fontSize: 8}} render={({ pageNumber, totalPages }) =>
        <Text>Page {pageNumber} of {totalPages}</Text>
      />}
    </Page>
  </Document>
);

So within a Page component, you can use the render prop to get the pageContext. But since our SgaPdfFooter is going to be a component inside the Page, I need to structure it so that the footer can receive the pageNumber and totalPages from the Page's render prop.

Therefore, the SgaPdfFooter component should be a function component that uses the render prop. Wait, but how to integrate that with a reusable component. Alternatively, maybe the SgaPdfFooter is designed to receive the pageNumber and totalPages as props, but in practice, it's going to be rendered inside a Page's render function. Hmm, perhaps that's the way to go.

So for example, in the main Document component, each Page includes the footer as:

<Page size="A4" style={{ ... }}>
  ...
  <View style={footerStyle}>
    <View style={footerColumns}>
      <SgaPdfFooteLeft {...props} />
      <SgaPdfFooterCenter />
      <SgaPdfFooterRight pageNumber={pageNumber} totalPages={totalPages} />
    </View>
  </View>
</Page>

But in React-PDF, the Page component allows using a render prop to pass the page number context. So perhaps the SgaPdfFooter component is a component that uses the render prop to access the page numbers. Alternatively, create a higher-order component or a custom footer that uses the Page's render function.

This might complicate the structure. Let me think. The example in the docs uses the render function inside the Page. So to get page numbers, the SgaPdfFooter component should be created inside the Page's footer, and use the render prop.

But the user wants the SgaPdfFooter component to be reusable. So perhaps the SgaPdfFooter is a component that returns the three columns and requires the Page to pass the pageNumber and totalPages. However, that would mean the SgaPdfFooter is called inside the Page's render function.

Alternatively, can we create a custom element that wraps around the footer and uses the Page's context. Maybe create a SgaPdfFooter component that uses the render prop internally. For example:

import { View, Text } from '@react-pdf/renderer';

export const SgaPdfFooter = () => {
  return (
    <View>
      ...
    </View>
  );
};

But to have the page numbers inside, we need to create a function that takes the pageContext. Hence, perhaps the SgaPdfFooter is not a regular component, but a HOC or a component that uses the Page's render prop. Alternatively, wrap the footer inside a function inside the Page.

This might be tricky. Let me structure the example.

The SgaPdfFooter component can be a function that takes the props and returns the JSX for the footer. Then, when using the Page, we include the footer inside the Page's render function and pass the pageNumber and totalPages as props.

For example:

<Page size="A4" style={...} render={(context) => (
  <View>
    <MyContent />
    <SgaPdfFooter 
      documentId="ABC123" 
      version="1.0" 
      pageNumber={context.pageNumber} 
      totalPages={context.totalPages} />
  </View>
)}/>

This way, the SgaPdfFooter receives the necessary props. So the SgaPdfFooter component would be a function component that takes documentId, version, pageNumber, and totalPages as props.

So the SgaPdfFooter component could be structured as:

const SgaPdfFooter = ({ documentId, version, pageNumber, totalPages }) => (
  <View style={styles.footer}>
    <View style={styles.footerColumnLeft}>
      <Text>Document ID: {documentId}</Text>
      <Text>Version: {version}</Text>
    </View>
    <View style={styles.footerColumnCenter}>
      <Text>Printed copies are uncontrolled documents</Text>
    </View>
    <View style={styles.footerColumnRight}>
      <Text>Page {pageNumber} of {totalPages}</Text>
    </View>
  </View>
);

And then the styles for the footer columns would be flexDirection: 'row', and each column has appropriate widths.

For the layout, the footer Columns should be a flex-row with three sections. Perhaps each column takes 1/3 of the width.

Now, the footer is in three columns. So the parent View has flexDirection: 'row' and the three child Views each take flex: 1. Then, the left column has Document ID and Version as two lines. The styles would also need some padding or spacing to prevent the text from being too close to the edges.

The watermark is supposed to be a light "SGA" watermark on each page. The React-PDF library allows adding backgrounds using the style prop with position: 'absolute' and z-index. But the watermark needs to be on each page. So, one approach is to add a Watermark component that is an absolutely positioned View over the page. However, each Page could have their own Watermark component.

Alternatively, create a SgaPdfWatermark component that is added to each Page. The watermark would be a semi-transparent text, rotated, and positioned in the center.

So for the watermark:

<WaterMarkComponent>
  <Text>SGA</Text>
</WaterMarkComponent>

But how to implement that. Let's think. The watermark should be behind the content. So using position: 'absolute' with a lower z-index than the content. The text should be semi-transparent, rotated 45 degrees, and centered.

So the styles for the watermark would include:

position: 'absolute',
top: '50%',
left: '50%',
transform: 'translate(-50%, -50%) rotate(45deg)',
opacity: 0.3,
color: '#000',
fontSize: 80,
textAlign: 'center'

This would center the "SGA" text, rotate it 45 degrees, and make it semi-transparent.

So the SgaPdfWatermark component would be:

export const SgaPdfWatermark = () => (
  <View style={styles.watermark}>
    <Text>SGA</Text>
  </View>
);

Where styles.watermark is the above.

But the watermark needs to be on each page. So the main SgaPdfDocument component, which wraps around the Page components, can include the Watermark in each Page. For example, each Page in the document includes both the content and the watermark. 

Wait, but the SgaPdfDocument component is the main wrapper. It's a Document component from @react-pdf/renderer. The Document can have multiple Pages. So each Page inside SgaPdfDocument adds the Header, Footer, and Watermark.

So, for example, the SgaPdfDocument component could