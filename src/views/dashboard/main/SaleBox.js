import React from 'react';
import {BoxHeader} from "../../../components/BoxHeader";
import {getSaleMessages} from "../../../services/message";
import {MessageItem} from "../../../components/ListItem";
import {SaleMessagType} from "../../../services/data-type";

export class SaleBox extends React.PureComponent {
  state = {
    messagesFilterValue: 0,
    messages: [],
  };
  selections = ['全部未读', '我负责的', '我参与的', '待处理', '已读'];
  async componentWillMount() {
    try {
      const messages = await getSaleMessages();
      this.setState({ messages });
    } catch (e) {}
  }
  selectionCount = (index) => {
    const {messages} = this.state;
    switch (index) {
      default: return messages.length;
      case 0: return messages.filter(m => !m.read).length;
      case 1: return messages.filter(m => (!m.read && m.type === SaleMessagType.INCHARGE)).length;
      case 2: return messages.filter(m => (!m.read && m.type === SaleMessagType.PARTICIPANT)).length;
      case 3: return messages.filter(m => (!m.read && m.type === SaleMessagType.PENDING)).length;
      case 4: return messages.filter(m => m.read).length;
    }
  };
  get messagesDS() {
    const {messagesFilterValue, messages} = this.state;
    switch (messagesFilterValue) {
      default: return messages;
      case 0: return messages.filter(m => !m.read);
      case 1: return messages.filter(m => (!m.read && m.type === SaleMessagType.INCHARGE));
      case 2: return messages.filter(m => (!m.read && m.type === SaleMessagType.PARTICIPANT));
      case 3: return messages.filter(m => (!m.read && m.type === SaleMessagType.PENDING));
      case 4: return messages.filter(m => m.read);
    }
  };

  onSelect = e => this.setState({messagesFilterValue: parseInt(e.target.value, 10)});
  render() {
    return (
      <div className="board-layout message-box">
        <BoxHeader title="销售任务" selections={this.selections} onSelect={this.onSelect} selectionCount={this.selectionCount}/>
        <div className="message-list">
          {this.messagesDS.map((messages, index) => <MessageItem message={messages} key={index}/>)}
          {!this.messagesDS.length && <p>暂无内容</p>}
        </div>
      </div>
    );
  }
}
