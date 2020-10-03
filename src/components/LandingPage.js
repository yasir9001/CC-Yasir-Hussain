import React, { Component } from "react";
import { client } from "./../gqlSetup";
import { gql } from "apollo-boost";
import "./Landingpage.css";

export class LandingPage extends Component {
  constructor() {
    super();
    this.state = {
      user: {},
      isLoading: false,
      isFirstLoad: true,
    };
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.setState({ isLoading: true });
    const username = e.target.elements["username"].value;
    if (!username) return;
    client
      .query({
        query: gql`
          query($username: String!) {
            search(query: $username, type: USER, first: 1) {
              userCount
              nodes {
                ... on User {
                  bio
                  bioHTML
                  company
                  email
                  createdAt
                  location
                  login
                  name
                  projectsUrl
                  url
                  websiteUrl
                  createdAt
                  repositories(privacy: PUBLIC, first: 100) {
                    totalCount
                    nodes {
                      id
                      forkCount
                      stargazerCount
                      name
                      url
                      primaryLanguage {
                        name
                      }
                      createdAt
                      nameWithOwner

                      owner {
                        id
                        login
                      }
                    }
                  }
                  followers {
                    totalCount
                  }
                }
              }
            }
          }
        `,
        variables: {
          username,
        },
      })
      .then((result) => {
        if (!result.data) return;
        const user = result.data?.search?.nodes[0];
        const popularRepos = result.data?.search?.nodes[0]?.repositories.nodes.sort(
          (repo1, repo2) => repo2.stargazerCount - repo1.stargazerCount
        );
        const languagesUsed = popularRepos?.reduce((acc, value) => {
          let indexOflanguage = acc.findIndex(
            (language) => language?.name === value.primaryLanguage?.name
          );
          if (!value.primaryLanguage?.name) {
            return acc;
          } else if (indexOflanguage !== -1) {
            acc[indexOflanguage].count += 1;
            return acc;
          } else {
            return [
              ...acc,
              {
                name: value.primaryLanguage?.name,
                count: 1,
              },
            ];
          }
        }, []);
        languagesUsed &&
          languagesUsed.forEach(
            (language, index) =>
              (languagesUsed[index].used =
                (language.count /
                  result.data?.search?.nodes[0]?.repositories.nodes.length) *
                100)
          );
        if (this.state.isFirstLoad) {
          this.setState({ isFirstLoad: false });
        }
        this.setState({
          user,
          languagesUsed,
          popularRepos: popularRepos?.slice(0, 7),
          isLoading: false,
        });
      });
  };
  render() {
    const {
      user,
      popularRepos,
      languagesUsed,
      isLoading,
      isFirstLoad,
    } = this.state;
    // console.log({ isFirstLoad, isLoading, isLoaded });
    return (
      <div className="landing-page-wrapper">
        <div
          className={`landing-page-title-wrapper ${
            !isFirstLoad ? "landing-page-title-wrapper-to-top" : ""
          }`}
        >
          <h1>My Github Resume</h1>
          <div className="input-form-wrapper">
            <form className="generate-form" onSubmit={this.handleSubmit}>
              <label>Github username</label>
              <div className="input-controll-box">
                <input placeholder="username" name="username" />
                <button type="submit">
                  {isLoading && (
                    <div>
                      <span className="loader"></span>
                    </div>
                  )}
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
        {user !== undefined && (
          <div
            className={`resume-wrapper ${!isFirstLoad ? "animate-resume" : ""}`}
          >
            <div className="user-info">
              <h1>{user?.name}</h1>
              {user?.bio && <p>{user?.bio}</p>}
              {user?.websiteUrl && (
                <div className="user-website-link">
                  <a className="pink-font" href={user.websiteUrl}>
                    {user.websiteUrl}
                  </a>
                </div>
              )}
              <p>
                On Github since {new Date(user?.createdAt).getFullYear()},{" "}
                {user.login} is a developer based in {user.location} with{" "}
                <span className="pink-font">
                  {" "}
                  {user.repositories?.totalCount} public repositories and
                </span>{" "}
                <span className="pink-font">
                  {user.followers?.totalCount} followers.
                </span>
              </p>
            </div>
            <div className="languages">
              <h1>Languages</h1>
              <div className="language-used-wrapper">
                {languagesUsed &&
                  languagesUsed.map((language, index) => {
                    return (
                      <div className="language-used-percent">
                        <div>
                          <span className="pink-font">{language.name}</span>{" "}
                          {language.used.toFixed(2)}%
                        </div>
                        <div className="language-used-percent-bar">
                          <div style={{ width: language.used }}></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="popular-repositories">
              <h3 className="title">Popular Repositories</h3>
              {popularRepos &&
                popularRepos.map((repo) => {
                  return (
                    <React.Fragment key={repo.id}>
                      <div className="popular-repo">
                        <div className="popular-repo-head">
                          <h4 className="pink-font">{repo.name}</h4>
                          <h4 className="font-faded">
                            {new Date(repo.createdAt).getFullYear()}
                          </h4>
                        </div>
                        <div className="repo-lang-rights font-faded">
                          {repo.primaryLanguage?.name && (
                            <span>{repo.primaryLanguage?.name} -</span>
                          )}{" "}
                          <span>
                            {repo.owner?.login === user.login
                              ? "OWNER"
                              : "COLLABORATOR"}
                          </span>
                        </div>
                        <div className="description">
                          <p>
                            The repository has {repo.stargazerCount} stars and{" "}
                            {repo.forkCount} forks. If you would like more
                            information about about this repo and my contributed
                            code, please visit the{" "}
                            <a
                              className="pink-font"
                              href={repo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {repo.name}
                            </a>{" "}
                            on Github.
                          </p>
                        </div>
                      </div>
                      <div className="repo-divider"></div>
                    </React.Fragment>
                  );
                })}
            </div>
          </div>
        )}
        {user === undefined && (
          <div className="not-found">
            <div>No User matched your search</div>
          </div>
        )}
      </div>
    );
  }
}

export default LandingPage;
