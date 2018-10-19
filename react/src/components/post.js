import React, { Component } from 'react';
import Comments from './comments'
import {app} from "../config/firebase_config"
import { Redirect, Link } from 'react-router-dom'

class Post extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: undefined,
            profile_pic: undefined,
            time: undefined,
            description: undefined,
            edit: false,
            post_id: props.post_id,
            image: undefined,
            comments: [],
            liked: false,
            render: true,
        }
    }

    updatePost = (snapshot) => {
        this.setState({
          username: snapshot.val().username,
          description: snapshot.val().description,
          time: new Date(snapshot.val().time).toDateString(),
          image: snapshot.val().image
        })
    }

    handleLike = () => {
      if(!this.props.logged) {
        alert("You must be logged in to do that.")
        return
      }

      if(!this.state.liked) {
        app.database().ref(`/posts/${this.state.post_id}/liked`).push({
          username: this.props.logged
        }).then((snap) => {
            this.setState({liked: true})
        }).catch(error => {
            console.log(error)
        })
      } else {
        app.database().ref(`/posts/${this.state.post_id}/liked`).orderByChild('username').equalTo(this.props.logged).once("value", (snapshot) => {
          if(snapshot.val()) {
              snapshot.forEach((snap) => {
                  if(snap.val().username === this.state.username) {
                      snap.ref.remove()
                      this.setState({liked: false})
                      return
                  }
                })
              }
            })
          }
  }

    handleDelete = () => {
      let input = window.confirm("Are you sure you want to delete this photo?")

      if(input) {
        app.database().ref(`/posts`).child(this.state.post_id).remove().then(() => {
          alert("Photo deleted!")
          this.setState({render: false})
        })
      }

      if(this.props.updateRedirect) {
        this.props.updateRedirect(true, "profile")
      }
    }

    handleSave = () => {
      app.database().ref(`/posts/${this.state.post_id}/description`).set(this.state.description).then(() => {
        this.setState({edit: false})
        alert("saved")
      }).catch((error) => {
        alert(error)
      })
    }

    handleEdit = () => {
      this.setState({edit: true})
    }

    handleEditChange = (e) => {
      this.setState({description: e.target.value})
    }

    handleSubmit = (e) => {
        e.preventDefault();

        if(!this.props.logged) {
          alert("You must be logged in to do that.")
          return
        }
        
        app.database().ref(`/comments`).child(this.state.post_id).push({
          username: this.props.logged,
          comment: this.input.value
      }).then((snap) => {
          console.log(snap)
          let new_comment = {username: this.props.logged, comment: this.input.value}
          this.setState({comments: [...this.state.comments, new_comment]})

          this.input.value = ""
      }).catch((error => {
          console.log(error)
      }))
    }

    componentDidMount = () => {
      app.database().ref(`/posts/${this.state.post_id}`).once('value', (snapshot) => {
          if(snapshot.val()) {
            this.updatePost(snapshot);
          } else {
              this.props.updateRedirect(true, "error")
          }
      }).then(() => {
        app.storage().ref(`profile/${this.state.username}`).child("profile").getDownloadURL().then((url) => {
          this.setState({profile_pic: url})
        }).catch((error) => {
            this.setState({profile_pic: "https://firebasestorage.googleapis.com/v0/b/react-social-network-7e88b.appspot.com/o/assets%2Fdefault.png?alt=media"})
        })
      })

      app.database().ref(`/posts/${this.state.post_id}/liked`).orderByChild('username').equalTo(this.props.logged).once("value", (snapshot) => {
        if(snapshot.val()) {
          this.setState({liked: true})
        } 
      });

      let commentsref = app.database().ref(`/comments/${this.state.post_id}`);
      commentsref.once("value", (snapshot) => {
          if(snapshot.val()) {
            Object.entries(snapshot.val()).forEach(([key, val]) => {
              this.setState({comments: [...this.state.comments, val]})
          });
          } 
      });
    }

    displayPhotosDropdown = () => {
      if(this.state.username == this.props.logged) {
        return (   
          <div className="dropdown is-hoverable is-right is-small photo-dropdown">
          <div className="dropdown-trigger">
              <button className="button" aria-haspopup="true" aria-controls="dropdown-menu3">
              <span className="icon is-small" style={{height: 0 + "px"}}>
                  <i className="fas fa-angle-down" aria-hidden="true"></i>
              </span>
              </button>
          </div>
          <div className="dropdown-menu" id="dropdown-menu3" role="menu">
              <div className="dropdown-content">
              <a onClick={this.handleEdit} className="dropdown-item">
                  Edit
              </a>
              <a onClick={this.handleDelete} className="dropdown-item">
                  Delete
              </a>

              </div>
          </div>
      </div>
        )
      } else {
        return null
      }
    }
    render() {
      if(this.state.redirect) {
        return <Redirect to="/error"/>
      } else {
        if(this.state.render) {
            return (
                <div className="post">
                <div className="card">
                <header>
                  <div className="media is-fullwidth">
                    <figure className="image is-48x48">
                      <img src={this.state.profile_pic} alt=""/>
                    </figure>
                    <p className="card-header-title content-username">
                      <Link to={`/u/${this.state.username}`}>{this.state.username}</Link>
                    </p>
                    <Link target="_blank" to={"/p/".concat(`${this.state.post_id}`)}><button className="button is-light is-small is-pulled-right share">Share</button></Link> 
                    
                    {this.displayPhotosDropdown()}

                  </div>
                </header>
          
                <div className="card-image">
                  <figure className="image">
                    <img src={this.state.image} alt=""/>
                  </figure>
                </div>
                <div className="card-content">
                  <div className="content">
                    <div className="content-options">
                      {this.state.liked ? <button onClick={this.handleLike} className="button is-danger is-small">Unlike</button>
                      :
                      <button onClick={this.handleLike} className="button is-danger is-outlined is-small">Like</button>
                      }
                    <time className="content-time">{this.state.time}</time></div>
                    <div className="content-body"  ref={(desc) => this.desc = desc}>
                    {
                      this.state.edit ? (
                        <div>
                          <textarea class='textarea' rows='1' onChange={this.handleEditChange}>{this.state.description}</textarea><br/>
                          <button class='button is-primary is-small' onClick={this.handleSave}>Save</button><br/>
                      </div>
                      ) : 
                      (this.state.description)
                    }
                    
                    </div>
                      <hr/>
                      {this.props.logged && <Comments data={this.state.comments}/>}

                    <form onSubmit={this.handleSubmit} style={{display: this.props.logged ? 'block' : 'none' }}>
                      <div className="field has-addons">
                        <div className="control is-expanded">
                          <input ref={(input) => this.input = input} className="input" type="text" placeholder="Add a comment" />
                        </div>
                        <div className="control">
                          <button className="button is-primary" type="submit">
                          Submit
                          </button>
                        </div>
                      </div>
                    </form>
    
                  </div>
                </div>
                </div>
                </div>
        );
        } else {
          return null
        }
      }
    }
}

export default Post;