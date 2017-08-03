import React from 'react';
import {observer, inject} from 'mobx-react';
import {observable, computed, action, runInAction} from 'mobx';
import {List, ListItem} from 'material-ui/List';
import Divider from 'material-ui/Divider';
import Subheader from 'material-ui/Subheader';
import {grey400, darkBlack} from 'material-ui/styles/colors';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import SelectField from 'material-ui/SelectField';
import MerchantSvc from '../../../services/merchant';
import MailIcon from 'material-ui/svg-icons/content/mail';
import ReadMailIcon from 'material-ui/svg-icons/content/drafts';
import CircularProgress from 'material-ui/CircularProgress';
import RaisedButton from 'material-ui/RaisedButton';
import {ToastStore as Toast} from "../../../components/Toast";

class applyMessageStore {
  @observable messages = [];
  @observable loading = false;
  @observable landed = false;

  @computed get DS() {
    return this.messages.filter(m => !m.accept);
  };

  @computed get historyDS() {
    return this.messages.filter(m => !!m.accept);
  };

  @action load = async (id) => {
    if (this.loading) return;
    this.loading = true;
    try {
      const resp = await MerchantSvc.getUserListByApply(id);
      runInAction('after load', () => {
        if (resp.code === '0' && resp.data) this.messages = [...resp.data];
      });
    } catch (e) {
      console.log(e, 'load invite message');
    }
    this.loading = false;
    if (!this.landed) this.landed = true;
  };

  serviceType = {
    ACCEPT: 'accept',
    REFUSE: 'refuse',
  };

  @action applyAction = async (id, type, updateUser) => {
    if (this.submitting || !id) return;
    this.submitting = true;
    try {
      let service = null;
      switch (type) {
        default: return;
        case this.serviceType.ACCEPT: service = MerchantSvc.acceptUserApply; break;
        case this.serviceType.REFUSE: service = MerchantSvc.refuseUserApply; break;
      }
      const resp = await service(id);
      runInAction('after accept', () => {
        if (resp.code === '0') {
          this.messages = [...this.messages.filter(m => m.id !== id)];
          Toast.show(type === this.serviceType.ACCEPT ? '已同意该用户加入' : '已拒绝该用户加入');
          if (type === this.serviceType.ACCEPT) {
            updateUser && updateUser();
          }
        } else {
          Toast.show(resp.msg || '抱歉，提交失败，请稍后重试');
        }
      });
    } catch (e) {
      console.log(e, 'accept user apply');
      Toast.show('抱歉，发生未知错误，请稍后重试');
    }
    this.submitting = false;
  };
}

class inviteMessageStore {
  @observable messages = [];
  @observable loading = false;
  @observable landed = false;

  @computed get DS() {
    return this.messages.filter(m => !m.accept);
  };

  @action load = async (id) => {
    if (this.loading) return;
    this.loading = true;
    try {
      const resp = await MerchantSvc.getMerchantListByInvite(id);
      runInAction('after load', () => {
        if (resp.code === '0' && resp.data) this.messages = [...resp.data];
      });
    } catch (e) {
      console.log(e, 'load invite message');
    }
    this.loading = false;
    if (!this.landed) this.landed = true;
  };

  serviceType = {
    ACCEPT: 'accept',
    REFUSE: 'refuse',
  };

  @action handleInviteAction = async (id, type, updateUser) => {
    if (this.submitting || !id) return;
    this.submitting = true;
    try {
      let service = null;
      switch (type) {
        default: return;
        case this.serviceType.ACCEPT: service = MerchantSvc.acceptMerchantInvite; break;
        case this.serviceType.REFUSE: service = MerchantSvc.refuseMerchantInvite; break;
      }
      const resp = await service(id);
      runInAction('after accept', () => {
        if (resp.code === '0') {
          this.messages = [...this.messages.filter(m => m.id !== id)];
          Toast.show(type === this.serviceType.ACCEPT ? '已同意加入该商户' : '已拒绝加入该商户');
          if (type === this.serviceType.ACCEPT) {
            updateUser && updateUser();
          }
        } else {
          Toast.show(resp.msg || '抱歉，提交失败，请稍后重试');
        }
      });
    } catch (e) {
      console.log(e, 'handle invite error');
      Toast.show('抱歉，发生未知错误，请稍后重试');
    }
    this.submitting = false;
  };
}

const MessageType = {
  INVITE: 0,
  APPLY: 1,
};

const applyStore = new applyMessageStore();
const inviteStore = new inviteMessageStore();

export default class Message extends React.PureComponent {
  render() {
    return (
      <div className="search-content">
        <MessageList store={applyStore} type={MessageType.APPLY}/>
        <MessageList store={inviteStore} type={MessageType.INVITE}/>
        <History />
      </div>
    );
  }
}

const iconButtonElement = (
  <IconButton
    touch={true}
    tooltip="操作"
    tooltipPosition="bottom-left"
  >
    <MoreVertIcon color={grey400} />
  </IconButton>
);

@inject('user')
@observer
class MessageList extends React.Component {
  store = this.props.store;
  componentWillMount() {
    const {type} = this.props;
    const currentUser = this.props.user.user.current;
    if (!currentUser) return;
    this.store.load(type === MessageType.APPLY ? currentUser.mer_id : currentUser.id);
  }
  render() {
    const {DS, loading, serviceType, landed} = this.store;
    const {type, user} = this.props;
    const isInvite = type === MessageType.INVITE;
    if (!user.user.current.is_admin && !isInvite) return null;
    // if (user.user.current.is_admin && isInvite) return null;
    const serviceAction = isInvite ? this.store.handleInviteAction : this.store.applyAction;

    let headerTxt = '';
    let messageTip = '';
    let primaryTxtTip = '';
    switch (type) {
      default: return;
      case MessageType.INVITE:
        headerTxt = '商户邀请';
        messageTip = '邀请加入商户';
        primaryTxtTip = '商户';
        break;
      case MessageType.APPLY:
        headerTxt = '用户申请';
        messageTip = '申请加入商户';
        primaryTxtTip = '用户';
        break;
    }

    return (
      <List className='search-list'>
        <div style={{backgroundColor: '#FFF'}}>
          <Subheader >{headerTxt}</Subheader>
          {loading && !landed && <CircularProgress size={28} style={{display: 'block', margin: '0 auto 20px auto'}}/>}
          {!DS.length && !loading && <p className="none-data" style={{textAlign: 'center'}}>暂无内容</p>}
          {(DS.length > 0) && <Divider inset={true} />}
        </div>
        <div className='list-container'>
          {
            DS.map((item, index) => (
              <div key={index} style={{backgroundColor: '#FFF'}}>
                <ListItem
                  leftIcon={<MailIcon />}
                  rightIconButton={(
                    <IconMenu iconButtonElement={iconButtonElement}>
                      <MenuItem onTouchTap={() => serviceAction(item.id, serviceType.ACCEPT, this.props.user.getUser)}>同意</MenuItem>
                      <MenuItem onTouchTap={() => serviceAction(item.id, serviceType.REFUSE)}>拒绝</MenuItem>
                    </IconMenu>
                  )}
                  primaryText={`${primaryTxtTip}: ${isInvite ? item.mer_name : item.name}`}
                  secondaryText={
                    <p>
                      <span style={{color: darkBlack}}>{item.remark || messageTip}</span><br />
                      {item.create_time}
                    </p>
                  }
                  secondaryTextLines={2}
                />
                {((DS.length - 1) !== index) && <Divider inset={true} />}
              </div>
            ))
          }
        </div>
      </List>
    );
  }
}

@inject('user')
@observer
class History extends React.Component {
  store = applyStore;
  constructor(props) {
    super(props);
    this.state = {
      showHistory: false,
      filterValue: 1,
    }
  }
  setHistoryVisible = () => this.setState({showHistory: true});
  get listDS() {
    const {filterValue} = this.state;
    switch (filterValue) {
      default: return this.store.historyDS;
      case 1: return this.store.historyDS;
      case 2: return this.store.historyDS.filter(item => item.accept === 1);
      case 3: return this.store.historyDS.filter(item => item.accept === 2);
    }
  }
  render() {
    const {user} = this.props;
    const {showHistory} = this.state;
    const {historyDS, loading} = this.store;
    return !showHistory ? (
      <div className='message-history'>
        {!!user.user.current.is_admin && !!historyDS.length && (
          <RaisedButton label="查看历史申请" onTouchTap={this.setHistoryVisible}/>
        )}
      </div>
    ) : (
      <List className='search-list'>
        <div style={{backgroundColor: '#FFF'}}>
          <Subheader style={{position: 'relative'}}>
            历史申请记录
            <this.FilterItem />
          </Subheader>
          {!this.listDS.length && !loading && <p className="none-data" style={{textAlign: 'center'}}>尚无记录</p>}
          {(this.listDS.length > 0) && <Divider inset={true} />}
        </div>
        <div className='list-container'>
          {
            this.listDS.map((item, index) => (
              <div key={index} style={{backgroundColor: '#FFF'}}>
                <ListItem
                  leftIcon={<ReadMailIcon />}
                  primaryText={`用户: ${item.name}`}
                  secondaryText={
                    <p>
                      <span style={{color: darkBlack}}>
                        处理结果：{item.accept === 1 ? '已同意' : '已拒绝'}
                      </span><br />
                      处理时间：{item.accept_time}
                    </p>
                  }
                  secondaryTextLines={2}
                />
                {((historyDS.length - 1) !== index) && <Divider inset={true} />}
              </div>
            ))
          }
        </div>
      </List>
    );
  }
  handleFilterChange = (event, index, filterValue) => this.setState({filterValue});
  FilterItem = () => (
    <SelectField
      hintText="筛选"
      value={this.state.filterValue}
      labelStyle={{ color: '#999', paddingRight: 26, top: -3 }}
      style={{position: 'absolute', right: 0, top: 0, width: 100, textAlign: 'center', fontSize: 12}}
      underlineStyle={{borderBottom: 'none'}}
      onChange={this.handleFilterChange}
    >
      <MenuItem value={1} primaryText="全部" />
      <MenuItem value={2} primaryText="已接受" />
      <MenuItem value={3} primaryText="已拒绝" />
    </SelectField>
  )
}