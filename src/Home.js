// Import the React hooks
import React, { useState, useEffect } from "react";
import "./Home.css";

import { Amplify, API } from "aws-amplify";
import { useNavigate } from "react-router-dom";

// GraphQL queries (read-only)
import { listBlogPosts } from "./graphql/queries";

// GraphQL mutators
import {
  createBlogPost as createBlogPostMutation,
  deleteBlogPost as deleteBlogPostMutation,
  updateBlogPost as updateBlogPostMutation,
} from "./graphql/mutations.js";

// Import the AWS Amplify hooks and components
import {
  useTheme,
  useAuthenticator,
  Badge,
  Button,
  ButtonGroup,
  Card,
  Flex,
  Grid,
  Heading,
  ScrollView,
  Image,
  Text,
  TextAreaField,
  TextField,
  View,
} from "@aws-amplify/ui-react";

// Import styles and app basics
import "@aws-amplify/ui-react/styles.css";
import "./w3-theme-dark-grey.css";
import awsExports from "./aws-exports";
Amplify.configure(awsExports);

// blogInitialFormState is used as the default values for blog entries
const blogInitialFormState = { title: "Blog Title", content: "Blog Content" };

// Just for fun -- source of random images to attach to the blog entries
const imageURL = "https://picsum.photos/200";

/**
 * Default function with primary logic for the app.
 */
export default function Home() {
  // These hooks must be in a particular order for React to function properly
  // blogPosts holds the array of blogPosts for display
  const [blogPosts, setBlogPosts] = useState([]);

  // blogFormData records the title and content of blog posts being created or changed
  const [blogFormData, setBlogFormData] = useState(blogInitialFormState);

  // viewBlogPost refers to the blogPost currently in the view pane
  // It is empty by default, but when changed will trigger a state update and redraw.
  // Once set, a viewBlogPost will always be set unless all blog posts are deleted.
  const [viewBlogPost, setViewBlogPost] = useState([]);

  // isUpdate is true when a blog entry is being updated, false otherwise.
  // Used to track status over time as the user is updating a blog entry.
  const [isUpdate, setIsUpdate] = useState(false);

  // The Id for the blog entry being updated. Corresponds to isUpdate -- is 0 when
  // no update is being made, and the Id when an update is being made.
  const [updateId, setUpdateId] = useState(0);

  const { tokens } = useTheme();

  // The authenticator is used to login/logout a user and provide status
  const { user, signOut } = useAuthenticator((context) => [context.user]);

  // Route is used to navigate between pages
  const { route } = useAuthenticator((context) => [context.route]);
  const navigate = useNavigate();

  // useEffect() is called whenever the DOM is updated
  // Use it here to refresh our display
  useEffect(() => {
    fetchBlogPosts();
  }, []);

  // Set the document/page title
  useEffect(() => {
    document.title = "Simple CRUD Blog";
  }, []);

  // Return true if a user is logged in; false otherwise.
  const isAuthenticated = () => {
    return route === "authenticated";
  };

  // Potential bug in AWS Amplify -- the graphQL schema and amplify configuration is setup
  // to allow unauthenticated users to conduct read operations (listBlogPosts), however
  // it just doesn't seem to work for the initial startup in an unauthenticated state.
  // This work around fixes the problem. *shrug*
  if (isAuthenticated()) {
    Amplify.configure({
      aws_appsync_authenticationType: "AMAZON_COGNITO_USER_POOLS",
    });
  } else {
    Amplify.configure({
      aws_appsync_authenticationType: "API_KEY",
    });
  }

  /**
   * Retrieve all blog posts from the API and display to the user.
   */
  async function fetchBlogPosts() {
    console.log("fetchBlogPosts");
    // Run the listBlogPosts() query from the GraphQL API to retrieve all current
    //  blog posts
    const apiData = await API.graphql({
      query: listBlogPosts,
      error: (error) =>
        console.log("fetchBlogPosts> Error: " + JSON.stringify(error)),
    });

    // Convenience variable to store all of the blog post items
    const blogPostsFromAPI = apiData.data.listBlogPosts.items;

    console.log("fetchBlogPosts> blogPostsFromAPI: " + blogPostsFromAPI);

    // Update the local cop of the blogPosts using the API pull
    setBlogPosts(blogPostsFromAPI);
  }

  /**
   * Use data currently in the blog entry fields to create a new blog entry.
   * @returns N/A
   */
  async function createBlogPost() {
    console.log(
      "createBlogPost> title: " +
        blogFormData.title +
        ", content: " +
        blogFormData.content
    );

    // Ignore request if the blogFormData tracking variables are empty.
    if (!blogFormData.title || !blogFormData.content) return;
    //		console.log( 'createBlogPost> Going to graphql, blogFormData: ' + blogFormData.content ) ;

    // Update the database with the new blog entry
    await API.graphql({
      query: createBlogPostMutation,
      variables: { input: blogFormData },
    });

    // Add the new blog post to the local copy of the list of blog entries
    //    setBlogPosts([...blogPosts, blogFormData]);
    //		console.log( 'createBlogPost> blogPosts: ' + blogPosts ) ;

    // Do a pull from the db to ensure the blog posts are synchronized.
    // Probably wouldn't do this in production, but useful for dev/test.
    fetchBlogPosts();

    // Reset the blogFormData tracking variable
    setBlogFormData(blogInitialFormState);
    //    console.log(
    //      "createBlogPost> blogInitialFormState: {" +
    //        blogInitialFormState.title +
    //        ", " +
    //        blogInitialFormState.content +
    //        "}"
    //   );
    console.log(
      "createBlogPost> blogFormData: {" +
        blogFormData.title +
        ", " +
        blogFormData.content +
        "}"
    );
  }

  /**
   * Update a blog post.
   */
  async function updateBlogPost() {
    /*    console.log(
      "updateBlogPost> title: " +
        blogFormData.title +
        ", content: " +
        blogFormData.content +
        ", id: " +
        updateId
    );
*/

    // Note: Resetting the updateBlog form areas to prevent this area from being locked
    // in the event of an authentication failure during the backend update process

    // Reset the data area being used to track changes
    setBlogFormData(blogInitialFormState);

    // Clear Id of the post being updated
    setUpdateId(0);

    // Stop the update process
    setIsUpdate(false);

    // Gather the information about the blog post being updated -- new
    // title, new content, and the Id of the entry
    const inputVar = {
      id: updateId,
      title: blogFormData.title,
      content: blogFormData.content,
    };

    // Update the backend database with the changes to the blog entry
    await API.graphql({
      query: updateBlogPostMutation,
      variables: { input: inputVar },
    });

    // If the blog being updated is also being viewed, update the view also
    // There's probably a better way in React to link these two fields, but
    // this will do for now.
    if (updateId === viewBlogPost.id) {
      setViewBlogPost(blogFormData);
    }

    // Update all of the blog posts in the Card pane
    fetchBlogPosts();
  }

  /**
   * Delete the blog post represented by the given id
   */
  async function deleteBlogPost({ id }) {
    // Remove the given blog post from the local blog post array
    const newBlogPostsArray = blogPosts.filter(
      (blogPost) => blogPost.id !== id
    );
    setBlogPosts(newBlogPostsArray);

    // Remove the blog post from the database back end
    await API.graphql({
      query: deleteBlogPostMutation,
      variables: { input: { id } },
    });

    // If the blog post just erased was also being viewed, then reset
    // the local tracker of the viewed blog post
    if (viewBlogPost.id === id) setViewBlogPost([]);
  }

  /**
   * This method notifies the DOM/vDOM that the user has requested a change, specifically
   * to update a blog post.
   * This should trigger a re-render of the blogContentTextAreaField and change the button name
   * and title and content.
   */
  async function initiateBlogPostUpdate(blogPost) {
    console.log(
      "initiateBlogPostUpdate> blogPost.id: " +
        blogPost.id +
        ", blogPost.title: " +
        blogPost.title +
        ", blogPost.content: " +
        blogPost.content
    );
    setIsUpdate(true);
    setBlogFormData(blogPost);
    setUpdateId(blogPost.id);
  }

  /**
   * Return the content control for a blog post. Record updates to the content
   * field in the blogFormData variable.
   */
  function blogContentTextAreaField(blogPostContent) {
    //    console.log(
    //      "blogContentTextAreaField> blogPostContent: " + blogPostContent
    //    );
    // Had to split this into two because I couldn't figure out a good way to include
    // an onChange() handler as a conditional
    if (!isAuthenticated()) {
      return (
        <TextAreaField
          autoComplete="off"
          direction="row"
          hasError={false}
          isDisabled={true}
          isReadOnly={true}
          isRequired={false}
          label="Blog Content"
          labelHidden={true}
          name="blogContent"
          value={blogFormData.content}
          placeholder="Login to create or update blog"
          rows="8"
          wrap="wrap"
          resize="vertical"
        />
      );
    } else {
      return (
        <TextAreaField
          autoComplete="off"
          direction="row"
          hasError={false}
          isDisabled={false}
          isRequired={false}
          label="Blog Content"
          labelHidden={true}
          name="blogContent"
          placeholder="Blog Content Goes Here :)"
          rows="8"
          defaultValue="Blog Content Goes Here :)"
          wrap="wrap"
          value={blogFormData.content}
          resize="vertical"
          onChange={(e) =>
            setBlogFormData({
              ...blogFormData,
              content: e.currentTarget.value,
            })
          }
        />
      );
    }
  }

  /**
   * Logic to build the deleteBlogPostButton based on authentication state.
   */
  function deleteBlogPostButton(blogPost) {
    if (isAuthenticated() && user.username === blogPost.owner) {
      return (
        <Button size="small" onClick={() => deleteBlogPost(blogPost)}>
          Delete Blog Post
        </Button>
      );
    } else {
      return "";
    }
  }

  /**
   * Logic to build the updateBlogPostButton based on authentication state.
   */
  function updateBlogPostButton(blogPost) {
    if (isAuthenticated() && user.username === blogPost.owner) {
      return (
        <Button
          size="small"
          isDisabled={isUpdate}
          onClick={() => initiateBlogPostUpdate(blogPost)}
        >
          Update Blog Post
        </Button>
      );
    } else {
      return "";
    }
  }

  /**
   * Build and return a Card wrapping a single blogPost.
   * @param {*} blogPost: The individual blog post to wrap in the Card.
   * @returns
   */
  function BlogPostCard(blogPost) {
    //    console.log(
    //      "BlogPostCard> blogPost.title: " +
    //        blogPost.title +
    //        ", blogPost.content: " +
    //        blogPost.content
    //    );
    return (
      <View padding={tokens.space.xs}>
        <Card>
          <Flex direction="row" alignItems="flex-start">
            <Image
              alt="Random Image"
              src={imageURL + "?random=" + blogPost.id}
              width="20%"
            />
            <Flex
              direction="column"
              alignItems="flex-start"
              gap={tokens.space.xs}
            >
              <Flex>
                <Badge size="small" variation="info">
                  Created: {new Date(blogPost.createdAt).toString()}
                </Badge>
                <Badge size="small" variation="info">
                  Owner: {blogPost.owner}
                </Badge>
              </Flex>
              <Heading variation="quiet" maxLength={100} level={5}>
                {blogPost.title}
              </Heading>
              <TextAreaField
                variation="quiet"
                maxLength={100}
                rows={2}
                wrap="wrap"
                width="500px"
                isReadOnly={true}
                as="span"
              >
                {blogPost.content.length > 100
                  ? blogPost.content.substring(0, 99) + "..."
                  : blogPost.content}
              </TextAreaField>
              <ButtonGroup justification="center" variation="primary">
                {deleteBlogPostButton(blogPost)}
                {updateBlogPostButton(blogPost)}

                <Button size="small" onClick={() => setViewBlogPost(blogPost)}>
                  View Blog Post
                </Button>
              </ButtonGroup>
            </Flex>
          </Flex>
        </Card>
      </View>
    );
  }

  /**
   * Returns the login or logout button for the blog header, depending on current
   * authentication state.
   */
  const getLoginOrLogoutButton = () => {
    if (isAuthenticated()) {
      return (
        <Button size="small" onClick={signOut}>
          Sign Out
        </Button>
      );
    } else {
      return (
        <Button size="small" onClick={() => navigate("/Login")}>
          Sign In
        </Button>
      );
    }
  };

  /**
   * Return the header to be used for each blog page.
   */
  const getBlogHeader = () => {
    return (
      <>
        <center>
          <Heading level={1}>Basic CRUD Blog</Heading>
          <Text>
            {isAuthenticated() ? (
              <Text>Welcome {user.username}!</Text>
            ) : (
              "Please login to create or update blog posts"
            )}
          </Text>
          {getLoginOrLogoutButton()}
        </center>
      </>
    );
  };

  /**
   * This method is called to choose whether the blog post text field area is
   * to be used to create a new blog post or modify an existing blog post.
   * In the former case, populate the fields with default title and content and
   * set the button as createBlogPost.
   * In the latter case, populate the fields with title and content from the
   * referenced blogPost and set the button to update the blog post.
   * @returns
   */
  const renderCreateOrUpdateBlogView = () => {
    console.log("renderCreateOrUpdateBlogView> isUpdate: " + isUpdate);
    /*
    console.log(
      "renderCreateOrUpdateBlogView> updateId: " +
        updateId +
        ", blogFormData.title: " +
        blogFormData.title +
        ", blogFormData.content: " +
        blogFormData.content
    );
    */
    if (!isAuthenticated()) {
      return (
        <div>
          <TextField
            alignItems="baseline"
            direction="row"
            isReadOnly={true}
            label="Blog Title"
            labelHidden={false}
            isDisabled={true}
            name="blogTitle"
            value={blogFormData.title}
            placeholder="Login to create or update blog"
            rows="8"
          />
          <p>{blogContentTextAreaField(blogFormData.content)}</p>
        </div>
      );
    } else {
      return (
        <div>
          <TextField
            alignItems="baseline"
            direction="row"
            isReadOnly={false}
            label="Blog Title"
            labelHidden={false}
            isDisabled={false}
            name="blogTitle"
            value={blogFormData.title}
            placeholder="Login to create or update blog"
            rows="8"
            onChange={(e) =>
              setBlogFormData({
                ...blogFormData,
                title: e.target.value,
              })
            }
          />
          <p>{blogContentTextAreaField(blogFormData.content)}</p>
          <Button
            variation="primary"
            size="small"
            onClick={isUpdate ? updateBlogPost : createBlogPost}
          >
            {isUpdate ? "Update Blog Post" : "Create Blog Post"}
          </Button>
        </div>
      );
    }
  };

  // Default return for the Home function() is to build a grid
  // for the page with the header, blog list on the left, and
  // blog view and create/update blog controls on the right
  return (
    <Grid
      className="amplify-grid"
      templateColumns={{ base: "1fr", large: "1fr 1fr" }}
      templateRows={{ base: "repeat(4, 10rem)", large: "repeat(3, 10rem)" }}
      gap="var(--amplify-space-small)"
    >
      <View key="blogHeaderView" padding={tokens.space.medium}>
        {getBlogHeader()}
      </View>
      <View key="blogPostListView" padding={tokens.space.medium}>
        {blogPosts.map((blogPost) => BlogPostCard(blogPost))}
      </View>
      <Flex className="container-flex-content-and-create">
        <ScrollView
          className="container-flex-content-and-create-child"
          key="viewBlogScrollView"
          orientation="vertical"
          padding={tokens.space.medium}
        >
          <Text>
            <b>Title:</b> {viewBlogPost.title}
          </Text>
          <Text>
            <b>Content:</b> {viewBlogPost.content}
          </Text>
        </ScrollView>
        <View
          className="container-flex-content-and-create-child"
          key="createOrUpdateBlogView"
          padding={tokens.space.medium}
        >
          {renderCreateOrUpdateBlogView()}
        </View>
      </Flex>
    </Grid>
  );
}
