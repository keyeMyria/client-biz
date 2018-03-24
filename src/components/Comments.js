import React from 'react';
import {observable, action, runInAction, computed} from 'mobx';
import {observer} from 'mobx-react';
import TextField from 'material-ui/TextField';
// import IconButton from 'material-ui/IconButton';
import {formatTime} from "../utils/time";
import {Button, Input} from 'antd';
import CommentSvc from '../services/comment';
import {ToastStore as Toast} from "./Toast";
import Storage from '../utils/storage';
import { Spin } from 'antd';

class CommentStore {
  @observable comments = [];
  @observable content = '';
  @observable billNo = null;
  @observable submitting = false;
  @observable loading = true;

  @computed get validated() {
    return !!this.content && !!this.content.trim();
  }

  @action setContent = val => this.content = val || '';

  @action load = async (billNo) => {
    this.loading = true;
    this.billNo = billNo;
    try {
      const resp = await CommentSvc.getCommentListWithInnerComment(billNo);
      runInAction('after load comment', () => {
        if (resp.code === '0') this.comments = resp.data;
        else Toast.show(resp.msg || '抱歉，获取评论失败，请尝试刷新页面');
      });
    } catch (e) {
      console.log(e, 'load bill comment');
    } finally {
      this.loading = false;
    }
  };

  @action onSend = async (e) => {
    e.preventDefault();
    if (this.submiting || !this.validated) return;
    this.submiting = true;
    try {
      const resp = await CommentSvc.create(this.billNo, this.content);
      runInAction('after send', () => {
        if (resp.code === '0') {
          const current = Storage.getValue('user');
          const date = formatTime(Date.now(), 'YYYY-MM-DD \u00a0 HH:mm:ss');
          const newComment = {content: this.content, user_name: current.name, user_id: current.id,
            create_time: date};
          this.comments.push(newComment);
          this.content = '';
        } else Toast.show(resp.msg || '抱歉，评论失败，请稍后重新尝试');
      });
    } catch (e) { console.log(e, '发布评论'); }
    this.submiting = false;
  };
}

@observer
export class Comments extends React.Component {
  store = new CommentStore();
  static styles = {
    smallIcon: {
      width: 24,
      height: 24,
      fontSize: 22,
      color: '#8A959E',
    },
    small: {
      width: 30,
      height: 30,
      padding: 4,
      marginRight: 10,
    },
  };

  keydownHandler = e => {
    if(e.keyCode===13 && e.ctrlKey) this.store.onSend(e);
  };
  componentWillMount() {
    this.store.load(this.props.billNo);
  }
  componentDidMount() {
    document.addEventListener('keydown', this.keydownHandler);
  }
  componentWillUnmount(){
    document.removeEventListener('keydown', this.keydownHandler);
  }

  CommentList = observer(() => {
    const {comments, loading} = this.store;
    if(loading) {
      return (<div style={{ textAlign: 'center', margin: '20px auto 0 auto' }}>
        <Spin />
      </div>)
    }
    return (
      <div className="comment-list">
        {comments.map((comment, index) => (
          <div key={index} className="comment-item">
            <div className="flex-row comment-info">
              {/*<p className="comment-company">{comment.company}</p>*/}
              <p style={{marginRight: 20}}>用户: {comment.user_name} (id: {comment.user_id})</p>
              <p>{comment.create_time}</p>
            </div>
            <p className="comment-content">{comment.content}</p>
          </div>
        ))}
      </div>
    )
  });

  render() {
    return (
      <div>
        <div className="comment-tabs">
          <button className="comment-tab active" disabled>评论</button>
        </div>
        <this.CommentList />
        <form className="comment-input">
          <Input.TextArea
            autosize={{ minRows: 2, maxRows: 6 }}
            placeholder={'请输入评论'}
            onPressEnter={this.store.onSend}
            value={this.store.content}
            className="input-area"
            style={{ marginBottom: 20 }}
            onChange={(e, v) => {
              this.store.setContent(e.target.value)
            }}
          />
          <div className="actions">
            <Button type={'primary'} disabled={!this.store.validated} onClick={this.store.onSend}>发表评论</Button>
          </div>
        </form>
      </div>
    );
  }
}