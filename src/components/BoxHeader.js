import React from 'react';
import {Select} from 'antd';
const Option = Select.Option;

export const BoxHeader = ({title, selections, onSelect, selectionCount}) => (
  <div className="header">
    <p className="title">{title}</p>
    <Select defaultValue={selections[0]} onChange={onSelect} className="styled-select slate">
      {
        selections.map(((selection, index) => <Option
          value={index}
          key={index}>
          {selection}&nbsp;&nbsp;{selectionCount(index) || 0}
        </Option>))
      }
    </Select>
  </div>
);

export const SelectItem = ({selections, onSelect, selectionCount}) => (
  <select onChange={onSelect} className="styled-select slate">
    {
      selections.map(((selection, index) => <option
        value={index}
        key={index}>
        {selection}&nbsp;&nbsp;{selectionCount && (selectionCount(index) || 0)}
      </option>))
    }
  </select>
);