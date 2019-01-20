import React, { Component } from 'react';
import './App.css';

import EditPageView from './EditPageView'

import fb from './firebase.js';
import LineTo from "react-lineto";

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      user: null,
      stories: [],
      selectedStory: null,
      selectedPage: null,
    }
  }

  handleLoginClicked() {
    fb.showAuthPopup();
    //TODO: Fix this bs with database rules

  }

  handleLogoutClicked() {
    if(!window.confirm("Sign out?")) {
      return;
    }
    fb.auth.signOut();
    window.location.reload(true);

  }

  handleUserAuth(user) {
    this.setState({user: user});
    if(user) {
        fb.base.bindCollection(`Stories`, {
            context: this,
            state: 'stories',
            withRefs: true
        });
    }
  }

  handleStorySelected(story) {
    if(this.state.selectedStory) {
      //TODO: Remove binding
      //fb.base.removeBinding()
    }
    this.setState({selectedStory: story});
    if(!story) {
        return;
    }
    fb.base.bindCollection(story.ref.collection('Pages'), {
      context: this,
      state: 'pages',
      withRefs: true
    });
  }

  handleTileDragStart(event) {
    // Don't show ghost on drag
      event.dataTransfer.setDragImage(new Image(0, 0), 0, 0);
  }

  handleTileDrag(event, page) {
    let pagesNew = this.state.pages;
    if(event.pageX === 0 && event.pageY === 0) {
      return;
    }
    pagesNew[this.state.pages.indexOf(page)].x = event.pageX;
    pagesNew[this.state.pages.indexOf(page)].y = event.pageY - 200;
    this.setState({
        pages: pagesNew
    })
  }

  handleTileRelease(event, page) {
      page.ref.set({
          x: event.pageX < 0 ? 0 : event.pageX,
          y: event.pageY - 200 < 0 ? 0 : event.pageY - 200,
      }, {merge: true});
  }

  handlePageSelect(page) {
    this.setState({
        selectedPage: page,
    });
  }

  addTile() {
      this.state.selectedStory.ref.collection('Pages').add({
        title: window.prompt("Enter Page Title:") || "New Page",
        x: 300,
        y: 300,
        deltas: "{}",
        editing: null,
    });
  }

  addStory() {

      const users = {};
      users[this.state.user.uid] = "rwa";

      fb.db.collection('Stories').add({
          title: window.prompt("Enter story name:") || "My Story",
          description: window.prompt("Enter story description:"),
          public: false,
          users: users,
      });
  }

  componentWillMount() {
    if(!fb.app) {
      fb.initialize(this.handleUserAuth.bind(this));
    }
    console.log("Will bind..");

    // if(!this.state.user) {
    //     return;
    // }
    // fb.base.bindCollection(`Stories`, {
    //     context: this,
    //     state: 'stories',
    //     withRefs: true
    // });
  }

  render() {


    let authUI = this.state.user ? (
        <div>
          <img className="authUI" onClick={this.handleLogoutClicked} src={this.state.user.photoURL} />
        </div>
    ) : (
        <div>
            <button className="authUI" onClick={this.handleLoginClicked.bind(this)} >Login</button>
        </div>
    );

    let storiesList = this.state.selectedStory !== null ? (<div />) : (
        <div>
            {this.state.stories.map((story) => {
                return (
                    <div className="storyListItem"
                         key={story.ref.path}
                         onClick={() => {this.handleStorySelected(story)} }>
                      <h5>{story.title}</h5>
                      <p>{story.description}</p>
                    </div>
                );
            })}
            <button className="AddTileButton" onClick={() => {this.addStory()}}>+</button>
        </div>
    );



    //TODO: size container to content
    let pagesTiles = this.state.selectedStory && this.state.pages && (
        <div className="pageTileContainer">
            {this.state.pages.map( page => {
              let styles = {
                position: "absolute",
                width: '100px',
                height: '100px',
                padding: '5px',
                top: 'calc(10vh + '+page.y+"px)",
                left: page.x+"px",
                backgroundColor: page.color || 'white',
                overflow: 'hidden',
                  zIndex: 10,
              };

                  console.log(page.ref.path);
              return (
                  <div key={page.ref.path}
                       className={page.ref.path.substring(page.ref.path.lastIndexOf("/")+1)}
                       draggable="true"
                       onDrag={event => {this.handleTileDrag(event, page)}}
                       onDragStart={event => {this.handleTileDragStart(event)}}
                       onDragEnd={event => {this.handleTileRelease(event, page)}}
                       onClick={() => {this.handlePageSelect(page)}}
                       style={styles}>
                    <h5>{page.title}</h5>
                    <p>{page.ref.path.substring(page.ref.path.lastIndexOf("/")+1)}</p>
                  </div>
              )
            })}
            <LineTo from="IrKYmclgh80Hpf42rWQk"
                    to="rTO5188xnem2HaxKoqbr" />
            <button className="AddTileButton" onClick={() => {this.addTile()}}>+</button>
        </div>
    );

    let editView = this.state.selectedPage ? (
        <EditPageView pageData={this.state.selectedPage}
                      returnFunc={() => this.handlePageSelect(null)}/>
    ) : undefined;

    return (
      <div className="App">
        <header className="App-header">
          <h5>
              <button className="BackButton"
                      hidden={this.state.selectedStory === null}
                      onClick={() => {this.handleStorySelected(null); this.handlePageSelect(null);}}> {"<<"}
                      </button>
              Paracord <span><i>[beta]</i></span>
          </h5>
            {authUI}
        </header>
        <div className="App-content">
          {editView || pagesTiles || storiesList}

        </div>
      </div>
    );
  }
}

export default App;
