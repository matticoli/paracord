import React, {Component} from 'react';

import './App.css';

import EditPageView from './EditPageView'
import PreviewPageView from './PreviewPageView'

import fb from './firebase.js';
import MenuIcon from '@material-ui/icons/Menu';
import {createMuiTheme, MuiThemeProvider} from '@material-ui/core/styles';
import Draggable from 'react-draggable';
import AppBar from "@material-ui/core/AppBar";
import {
    Avatar,
    CardActions, CardHeader,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListSubheader
} from '@material-ui/core';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import Helpicon from '@material-ui/icons/Help';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import withStyles from "@material-ui/core/styles/withStyles";

import genericUserPhoto from './generic-user.jpg';
import Fab from "@material-ui/core/Fab";
import Card from "@material-ui/core/Card";
import {CardText, CardTitle} from "material-ui";
import Button from "@material-ui/core/Button";

const theme = createMuiTheme({
    typography: {
        useNextVariants: true,
    },
    palette: {
        primary: {
            main: '#222222',
            text: '#ffffff'
        }
    },
});


const styles = {
    root: {
        flexGrow: 1,
        fontFamily: "Sans-Serif",
    },
    grow: {
        flexGrow: 1,
        padding: 5,
        marginLeft: 10,
    },
    drawer: {
        minWidth: 200,
    },
    avatarName: {
        fontWeight: 'bold',
        marginLeft: 'auto',
        marginRight: 'auto',
        textAlign: 'center',
    },
    bigAvatar: {
        margin: 10,
        width: 80,
        height: 80,
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    icon: {
        height: 35,
        width: 35,
    },
    list: {
        width: 'auto',
    },
    fullList: {
        width: 'auto',
    },
    menuButton: {
        marginLeft: -12,
        marginRight: 20,
        height: 50,
        width: 50,
    },
    accountButton: {
        backgroundColor: "#A10C32",
        display: 'inline-block',
        height: 40,
        padding: 5,
        verticalAlign: 'middle'
    },
    accountButtonText: {
        display: 'inline-block',
        height: 40,
        paddingLeft: 5,
        paddingRight: 5,
        verticalAlign: 'middle'
    },
    accountButtonImg: {
        height: 30
    },
    backButton: {
        backgroundColor: "#a02c49"
    }
};

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            drawerOpen: false, // Whether drawer is open
            showHelp: false, // Whether to show help dialog
            user: null, // Current logged in user
            stories: [], // All accessible stories
            users: [], // All users
            selectedStory: null, // Current story selected
            selectedPage: null, // Current edit page
            previewPage: null, // Current preview page
            dragTime: 0, // Elapsed drag time
        }
    }

    toggleDrawer(event) {
        if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }

        this.setState({drawerOpen: !this.state.drawerOpen});
    };

    toggleHelpDialog() {
        this.setState({
            showHelp: !this.state.showHelp
        });
    }

    handleLoginClicked() {
        fb.showAuthPopup();
    }

	handleUserAuth(user) {
		this.setState({user: user});
		if (user) {
			fb.base.bindCollection(`Stories`, {
				context: this,
				state: 'stories',
				withRefs: true
			});

			fb.base.bindCollection(`Users`, {
				context: this,
				state: 'users',
				withRefs: true,
			});
		}
	}

	handleUserSignOut() {
		if (!window.confirm("Sign out of " + this.state.user.displayName + "?")) {
			return;
		}
		this.setState({user: null});
		fb.auth.signOut();
	}

    handleStorySelected(story) {
        if (this.state.selectedStory) {
            //TODO: Remove binding
            //fb.base.removeBinding()
        }
        this.setState({selectedStory: story});
        if (!story) {
            return;
        }
        fb.base.bindCollection(story.ref.collection('Pages'), {
            context: this,
            state: 'pages',
            withRefs: true
        });
    }

    handleTileDragStart(event) {
        this.setState({
            dragTime: event.timeStamp
        });
    }

    handleTileDrag(event, page) {
        let pagesNew = this.state.pages;
        if (event.pageX === 0 && event.pageY === 0) {
            return;
        }
        pagesNew[this.state.pages.indexOf(page)].x = event.pageX;
        pagesNew[this.state.pages.indexOf(page)].y = event.pageY - 50;
        this.setState({
            pages: pagesNew
        })
    }

    handleTileRelease(event, page) {
        console.log(event.timeStamp + " " + this.state.dragTime);
        if(event.timeStamp - this.state.dragTime < 200) {
            return;
        }
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

    handlePagePreview(page) {
        this.setState({
            previewPage: page,
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

        let title, description;
        title = window.prompt("Enter story name:");
        if(title) description = window.prompt("Enter story description:");

        if(!title || !description) {
            return;
        }

        fb.db.collection('Stories').add({
            title: title,
            description: description,
            public: false,
            users: users,
        });
    }

    componentWillMount() {
        if (!fb.app) {
            fb.initialize(this.handleUserAuth.bind(this));
        }
        console.log("Will bind..");
    }

    render() {

        const classes = this.props.classes;

        let loginButton = this.state.user ? (
            <ListItem button color="inherit"
                      onClick={this.handleUserSignOut.bind(this)}>
                <ExitToAppIcon/>
                <ListItemText primary="Sign Out"></ListItemText>
            </ListItem>
        ) : (
            <ListItem button color="inherit"
                      onClick={() => {
                          return this.handleLoginClicked()
                      }}>
                <LockOpenIcon/>
                <ListItemText primary="Sign In With Google"></ListItemText>
            </ListItem>

        );

        let userDetail = this.state.user ? (
            <div>
                <Avatar
                    alt={(this.state.user && this.state.user.name) || "Unnamed User"}
                    src={(this.state.user && this.state.user.photoURL) || genericUserPhoto}
                    className={classes.bigAvatar}/>
                <ListSubheader className={classes.avatarName}>{this.state.user.displayName} </ListSubheader>
            </div>
        ) : (
            <div>
                <Avatar
                    alt={"No User"}
                    src={(this.state.user && this.state.user.photoURL) || genericUserPhoto}
                    className={classes.bigAvatar}/>
                <ListSubheader className={classes.avatarName}>{"Not Signed In"} </ListSubheader>
            </div>
        );

        let authUI = this.state.user ? (
            <div>
                <img alt="user" className="authUI" onClick={this.handleLogoutClicked} src={this.state.user.photoURL}/>
            </div>
        ) : (
            <div>
                <button className="authUI" onClick={this.handleLoginClicked.bind(this)}>Login</button>
            </div>
        );

        let storiesList = this.state.selectedStory !== null ? (<div/>) : (
            <List>
                <ListSubheader style={{backgroundColor: 'whitesmoke'}}><h2>My Stories</h2>
                    <Fab style={{position: "absolute", right: 50, top: 5}} size="large" color="primary" onClick={() => {
                        this.addStory()
                    }}>
                        <AddIcon />
                    </Fab>
                </ListSubheader>
                {this.state.stories.map((story) => {
                    return (
                        <ListItem className="storyListItem"
                             key={story.ref.path}
                             onClick={() => {
                                 this.handleStorySelected(story)
                             }}>
                            <ListItemText>
                                <h3>{story.title}</h3>
                                <p>{story.description}</p>
                            </ListItemText>
                        </ListItem>
                    );
                })}
            </List>
        );


        //TODO: size container to content
        let pagesTiles = this.state.selectedStory && this.state.pages && (
            <div className="pageTileContainer">
                <Button onClick={() => {
                    this.setState({selectedStory: null, pages: []})
                }}>Back to Stories</Button>
                {this.state.pages.map(page => {
                    let styles = {
                        // position: "absolute",
                        width: '180px',
                        height: '120px',
                        padding: '8px',
                        borderTop: '8px solid ' + (page.color || 'white'),
                        // overflow: 'hidden',
                        // zIndex: 10,
                    };

                    let title = page.title && page.title.substr(0, 30) +
                        (page.title.length > 30 ? "..." : "");
                    return (
                        <Draggable key={page.ref.path}
                                   position={{x: page.x, y: page.y}}
                                   onDrag={(evt) => {
                                       this.handleTileDrag.bind(this)(evt, page)
                                   }}
                                   onStart={this.handleTileDragStart.bind(this)}
                                   onStop={evt => {this.handleTileRelease(evt, page)}}>
                            <Card className={page.ref.path.substring(page.ref.path.lastIndexOf("/") + 1)}
                                 style={styles}>
                                <h3>{title || "No Title"}</h3>
                                <CardActions>
                                    <Button onClick={() => {
                                        this.handlePageSelect(page)
                                    }} size="small"><EditIcon />Edit</Button>
                                    <Button onClick={() => {
                                        this.handlePagePreview(page)
                                    }} size="small"><Helpicon />Preview</Button>
                                    <br />
                                </CardActions>
                            </Card>
                        </Draggable>
                    )
                })}
                <button className="AddTileButton" onClick={() => {
                    this.addTile()
                }}>+
                </button>
            </div>
        );

        let editView = this.state.selectedPage ? (
            <EditPageView pageData={this.state.selectedPage}
                          returnFunc={() => this.handlePageSelect(null)}/>
        ) : undefined;

        let previewView = this.state.previewPage ? (
            <PreviewPageView pageData={this.state.previewPage}
                             returnFunc={() => this.handlePagePreview(null)}/>
        ) : undefined;

        return (
            <div className="App">
                <MuiThemeProvider theme={theme}>
                    <AppBar position="static">
                        <Toolbar>
                            <IconButton className={classes.menuButton} color="inherit" aria-label="menu"
                                        onClick={this.toggleDrawer.bind(this)}>
                                <MenuIcon className={classes.icon}/>
                            </IconButton>
                            <div className={classes.grow}>
                                <Typography variant="h5" align="left" color="inherit">
                                    <b>Paracord Engine</b><sup> beta</sup>
                                </Typography>
                            </div>
                        </Toolbar>
                    </AppBar>
                    <Drawer className={classes.drawer} open={this.state.drawerOpen}
                            onClose={this.toggleDrawer.bind(this)}>
                        {userDetail}
                        <List className={classes.drawer}>
                            <Divider/>
                            {loginButton}
                            <ListItem button
                                      size="small"
                                      color='inherit'
                                      aria-label="Upload"
                                      onClick={this.toggleHelpDialog.bind(this)}>
                                <Helpicon/>
                                <ListItemText primary={"Help"}></ListItemText>
                            </ListItem>
                        </List>
                        <div style={{"width": "1vw"}}></div>
                        <div>
                            <br/>
                        </div>
                    </Drawer>
                    <div className="App-content">
						{this.state.user && (previewView || editView || pagesTiles || storiesList) || (
                            <h3 style={{marginLeft: 30}}><ArrowUpwardIcon /> Please Sign in to continue</h3>
                        )}

                    </div>
                </MuiThemeProvider>

            </div>
        );
    }
}

export default withStyles(styles)(App);
;
