import React, { useState, useEffect } from "react";
import "./App.css";

import { Amplify, API, Auth } from "aws-amplify";
import { useNavigate } from "react-router-dom";
import { listBlogPosts } from "./graphql/queries";
import {
  createBlogPost as createBlogPostMutation,
  deleteBlogPost as deleteBlogPostMutation,
  updateBlogPost as updateBlogPostMutation,
} from "./graphql/mutations.js";

import {
  useTheme,
  useAuthenticator,
  Authenticator,
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
  View,
} from "@aws-amplify/ui-react";

import "@aws-amplify/ui-react/styles.css";
import awsExports from "./aws-exports";
Amplify.configure(awsExports);

// blogInitialFormState is used to record interim updates to the text fields for creating or updating
// a blog entry.
const blogInitialFormState = { title: "Blog Title", content: "Blog Content" };

// Just for fun -- source of random images to attach to the blog entries
const imageURL = "https://picsum.photos/200";

function IsAuthenticated() {
  const { route } = useAuthenticator((context) => [context.route]);
  return route === "authenticated";
}

export default function Home() {
  const [blogPosts, setBlogPosts] = useState([]);
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

  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const { route } = useAuthenticator((context) => [context.route]);
  const navigate = useNavigate();

  // useEffect() is called whenever the DOM is updated
  // Use it here to refresh our display
  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const AuthFunction = () => {
    //    console.log("AuthFunction> isLoggedIn: " + authProps.isLoggedIn);
    return (
      <Authenticator>
        {({ signOut, user }) => (
          <main>
            <h1>Hello {user.username}</h1>
            <button onClick={signOut}>Sign out</button>
          </main>
        )}
      </Authenticator>
    );
  };

  // Return true if a user is logged in; false otherwise.
  const isAuthenticated = () => {
    return route === "authenticated";
  };

  /**
   * Retrieve all blog posts from the API and display to the user.
   */
  async function fetchBlogPosts() {
    console.log("fetchBlogPosts");
    // Run the listBlogPosts() query from the GraphQL API to retrieve all current
    //  blog posts
    const apiData = await API.graphql({ query: listBlogPosts });

    // Convenience variable to store all of the blog post items
    const blogPostsFromAPI = apiData.data.listBlogPosts.items;

    //    console.log("fetchBlogPosts> blogPostsFromAPI: " + blogPostsFromAPI);

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
    setBlogPosts([...blogPosts, blogFormData]);
    //		console.log( 'createBlogPost> blogPosts: ' + blogPosts ) ;

    // Reset the blogFormData tracking variable
    setBlogFormData(blogInitialFormState);
    console.log(
      "createBlogPost> blogInitialFormState: {" +
        blogInitialFormState.title +
        ", " +
        blogInitialFormState.content +
        "}"
    );
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
    console.log(
      "blogContentTextAreaField> blogPostContent: " + blogPostContent
    );
    return (
      <Flex as="form" direction="column">
        <TextAreaField
          autoComplete="off"
          direction="row"
          hasError={false}
          isDisabled={false}
          isRequired={false}
          label="Blog Content"
          labelHidden={false}
          name="blogContent"
          placeholder="Blog Content Goes Here :)"
          rows="8"
          value={blogPostContent}
          wrap="wrap"
          resize="vertical"
          onChange={(e) =>
            setBlogFormData({ ...blogFormData, content: e.currentTarget.value })
          }
        />
      </Flex>
    );
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
      <View
        backgroundColor={tokens.colors.background.secondary}
        padding={tokens.space.medium}
      >
        <Card>
          <Flex direction="row" alignItems="flex-start">
            <Image
              alt="Road to milford sound"
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
                <Button size="small" onClick={() => deleteBlogPost(blogPost)}>
                  Delete Blog Post
                </Button>
                <Button
                  size="small"
                  isDisabled={isUpdate}
                  onClick={() => initiateBlogPostUpdate(blogPost)}
                >
                  Update Blog Post
                </Button>
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

  const Login = () => {
    console.log("Login>");
    //    return (
    //      <Authenticator variation="modal">
    //        {({ signOut }) => <button onClick={signOut}>Sign out</button>}
    //      </Authenticator>
    //    );
    return Auth.signIn();
  };

  // const Login = () => <Authenticator />;

  const handleStateChange = (state) => {
    console.log("handleStateChange.handleStateChange> state: " + state);
    if (state === "signedIn") {
      console.log("handleStateChange> signedIn event");

      //      this.props.onUserSignIn();
    }
  };

  const getLoginOrLogoutButton = () => {
    if (IsAuthenticated()) {
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
      //      return <Authenticator variation="modal" />;
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
            {IsAuthenticated() ? (
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
    return (
      <div className="App">
        <input
          onChange={(e) =>
            setBlogFormData({
              ...blogFormData,
              title: e.target.value,
            })
          }
          placeholder="Blog Title"
          value={blogFormData.title}
        />
        {blogContentTextAreaField(blogFormData.content)}
        <Button
          variation="primary"
          size="small"
          onClick={isUpdate ? updateBlogPost : createBlogPost}
        >
          {isUpdate ? "Update Blog Post" : "Create Blog Post"}
        </Button>
      </div>
    );
  };

  return (
    <Grid
      templateColumns={{ base: "1fr", large: "1fr 1fr" }}
      templateRows={{ base: "repeat(4, 10rem)", large: "repeat(3, 10rem)" }}
      gap="var(--amplify-space-small)"
    >
      <View
        columnSpan={2}
        backgroundColor={tokens.colors.background.secondary}
        padding={tokens.space.medium}
      >
        {getBlogHeader()}
      </View>
      <View
        rowSpan={2}
        backgroundColor={tokens.colors.background.secondary}
        padding={tokens.space.medium}
      >
        {blogPosts.map((blogPost) => BlogPostCard(blogPost))}
      </View>
      <ScrollView
        orientation="vertical"
        backgroundColor={tokens.colors.background.secondary}
        padding={tokens.space.medium}
      >
        <Text>Title: {viewBlogPost.title}</Text>
        <Text>Content: {viewBlogPost.content}</Text>
      </ScrollView>
      <View
        backgroundColor={tokens.colors.background.secondary}
        padding={tokens.space.medium}
      >
        {renderCreateOrUpdateBlogView()}
      </View>
    </Grid>
  );
}
