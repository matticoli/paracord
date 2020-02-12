import React, { Component } from 'react';
import './App.css';
import ReactQuill from 'react-quill'; // ES6
import 'react-quill/dist/quill.snow.css'; // ES6

import fb from './firebase.js';

class EditPageView extends Component {

    constructor(props) {
        super(props);

        this.state = {
            pageData: this.props.pageData
        }

        var toolbarOptions = [
            ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
            ['blockquote', 'code-block'],

            [{ 'header': 1 }, { 'header': 2 }],               // custom button values
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
            [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
            [{ 'direction': 'rtl' }],                         // text direction

            [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

            [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['link', 'image', 'custom'],

            ['clean']                                         // remove formatting button
        ];

        this.modules = {
            'toolbar': toolbarOptions,
            // 'image-tooltip': true,
            // 'link-tooltip': true
        }
    }

    updatePage(content, delta, source, editor) {
        if(!this.editor) {
            this.editor = editor;
        }
        let contents = editor.getContents();

        console.log(contents);
        this.state.pageData.ref.set({deltas: JSON.stringify(contents)}, {merge: true});
    }

    handleDelete() {
        if(window.confirm("Are you sure you want to delete this page?\nYou can't undo this!")) {
            this.state.pageData.ref.delete();
        }
    }

    handleColorChange(event) {
        this.state.pageData.ref.set({color: event.target.value}, {merge: true});
    }
    handleTitleChange(event) {
        this.state.pageData.ref.set({title: event.target.value}, {merge: true});
    }

    componentWillMount() {
        if(!fb.app) {
            return;
        }

        //TODO: store deltas as array and update per-delta if user did not cause
        this.state.pageData.ref.onSnapshot(function(doc) {
            console.log(doc.data());
            if(this.editor) {
                // this.editor.updateContents(JSON.parse(doc.data().deltas));
            }
        }.bind(this));
    }



    render() {
        // console.log(this.props.pageData.deltas);
        let puid = this.props.pageData && this.props.pageData.ref.path || "";
        puid = puid.substr(puid.lastIndexOf("/") + 1);

        return (<div>
            <div className="EditToolbar">
                <button onClick={this.props.returnFunc}>Back</button>
                <button style={{backgroundColor: "red"}}
                        onClick={this.handleDelete.bind(this)}>Delete</button>
                <label>Page Title: </label>
                <input className="EditBarInput"
                       type="text"
                       defaultValue={this.state.pageData.title || "white"}
                       onChange = {this.handleTitleChange.bind(this)} />
                <label>Tile Color: </label>
                <input className="EditBarInput"
                       type="text"
                       defaultValue={this.state.pageData.color || "white"}
                       onChange = {this.handleColorChange.bind(this)} />
                <label>Page ID (For Linking): </label>
                <input className="EditBarInput"
                       readOnly="true"
                       type="text"
                       value={puid} />
            </div>
            <ReactQuill className="ReactQuill"
                        modules={this.modules}
                        defaultValue={JSON.parse(this.state.pageData.deltas) || ""}
                        onChange={this.updatePage.bind(this)} />
        </div>)
    }
}

export default EditPageView;
