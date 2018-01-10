const ORIGIN = "origin";
const MODIFY = "modify";
const NEW = "new";
const NEW_MODIFY = "newmodify";

var cloneObj = function(obj){
    var str, newobj = obj.constructor === Array ? [] : {};
    if(typeof obj !== 'object'){
        return;
    } else if(window.JSON){
        str = JSON.stringify(obj), //系列化对象
        newobj = JSON.parse(str); //还原
    } else {
        for(var i in obj){
            newobj[i] = typeof obj[i] === 'object' ?
            cloneObj(obj[i]) : obj[i];
        }
    }
    return newobj;
};

var Datas = {
	find : function(datas, keyValue, keyName) {
    if(datas == null) return -1;
    if(!Array.isArray(datas)) {
      throw "Datas is not a array";
    }
    for(var index of datas.keys()) {
      if(datas[index][keyName] == keyValue) {
        return index;
      }
    }
		return -1;
	}
}

/*
* datas(array) : 填充表格的数据集
* primaryKey : 数据的主键名
* apiSave : 保存的api
* apiDelete : 删除的api
*/
var Table = React.createClass({

  getDefaultProps : function() {
    return {
      apiSave : function(data) {
        return true;
      },
      apiDelete : function(data) {
        return true;
      }
    }
  },

  componentDidMount : function () {
    console.debug("装载组件:", "\n",
      "props:", this.props, "\n",
      "state:", this.state);
    this.originDatas = cloneObj(this.state.datas);
    console.debug("拷贝原始数据:", "\n", "originDatas:", this.originDatas);
  },

	getInitialState : function() {
    this.columns = this.getColumns();
    console.debug(this.columns);
    var primaryKey = this.props.primaryKey;
		var datas = this.props.datas.map(function(data) {
			data._status = ORIGIN;
			data._key = data[primaryKey];
			return data;
		});
		return {
			datas : datas,
			hasNewRow : false
		}
	},
	getColumnTitles : function() {
		var titles = this.props.titles;
    return titles.map((data) => (
      <th className="single line">{data}</th>
    ));
	},

	getRow : function(data, index) {
		return <Row data={data}
      key={data._key}
			onDeleteClick={this.deleteClick}
			onModifyClick={this.modifyClick}
			onSaveClick={this.saveClick}
			onCancelClick={this.cancelClick}
			onChange={this.onChange}
			getOriginData={this.getOriginData}
      columns = {this.columns}
      />
	},

  getColumns : function () {
    var columns = new Array();
    React.Children.map(this.props.children, function(child) {
      if(child.type.displayName == "Column") {
        columns.push(child);
      }
    });
    return columns;
  },

	getRows : function() {
		var _this = this;
    return this.state.datas.map((data, index) => (_this.getRow(data)));
	},

  getOriginData : function(key) {
    var index = Datas.find(this.originDatas, key, "_key");
    if(index == -1) return null;
    return cloneObj(this.originDatas[index]);
  },

  setOriginData : function(data, key) {
    var index = Datas.find(this.originDatas, key, "_key");
    var cloneData = cloneObj(data);
    if(index == -1) return false;
    this.originDatas[index] = cloneData;
    return true;
  },

	onChange : function(data, index) {
    /*
		var index = Datas.find(this.state.datas, data._key, "_key");
		var datas = this.state.datas;
		datas[index] = data;
		console.debug("数据变化")
		console.debug(datas);
		console.debug(this.datas);
		this.setState({datas : datas});
    */
	},

	deleteClick : function(data, key) {
    if(!confirm("确认删除？")) return;
		var success = true;
    if(!success) {
      throw "delete fail " ;
    }

    var datas = this.state.datas;
    var index = Datas.find(this.state.datas, data._key, "_key");
		var originIndex = Datas.find(this.originDatas, data._key, "_key");

    console.debug("start delete row:", "\n",
      "index :", index, "originIndex :", originIndex);

    if(index != -1) {
      datas.splice(index, 1);
    }
		if(originIndex != -1) {
			this.originDatas.splice(originIndex, 1);
		}

    console.debug("after delete row:", "\n",
      "datas :", datas, "\n",
      "originDatas :", this.originDatas);

		this.setState({datas : datas});
	},

	modifyClick : function(data, key) {
    var datas = this.state.datas;
		var index = Datas.find(datas, data._key, "_key");
    if(index == -1) return;
		datas[index]._status = MODIFY;
		this.setState({datas : datas});
	},

	saveClick : function(data, index) {
		var success = true;
    success = this.props.apiSave(data);


    if(!success) {
      throw "error";
    }

    if(data._status == NEW || data._status == NEW_MODIFY) {
      data._status = ORIGIN;
      data._key = data[this.props.primaryKey];
      this.state.datas.push(data);
      this.originDatas.push(cloneObj(data));
      this.setState({datas : this.state.datas});
      this.setState({hasNewRow : false});
      return;
    }

    console.debug("before save:", "\n",
      "originDatas", this.originDatas);

    // 同步datas 与 originDatas 数据
    var datas = this.state.datas;
		var index = Datas.find(datas, data._key, "_key");

    data._status = ORIGIN;
		if(index != -1) {
      datas[index] = data;
		}
    if(!this.setOriginData(data, data._key)) {
      console.error("update origin data fail");
    }
    this.setState({datas : datas});

    console.debug("after save:", "\n",
      "originDatas:", this.originDatas);
	},

	cancelClick : function(data, index) {

		if(data._status == NEW || data._status == NEW_MODIFY) {
			this.setState({hasNewRow : false});
		}
    if(data._status != NEW && data._status != NEW_MODIFY) {

      console.debug("before cancelClick:", "\n",
        "datas :", this.state.datas);

      var datas = this.state.datas;
      var index = Datas.find(datas, data._key, "_key");

      if(index != -1) {
        var originData = this.getOriginData(data._key);
        if(originData == null) {
          throw "originData is null";
        }
        datas[index] = originData;
      }

      this.setState({datas : datas});
      console.debug("after cancelClick :", "\n",
        "datas :", this.state.datas);
    }
	},

	insertRow : function() {
		this.setState({hasNewRow : true});
	},

	getNewRow : function() {
    if(!this.state.hasNewRow)  return null;
		var data = {
			_status : NEW,
			_key : "",
		}
		return this.getRow(data, "");
	},

	render : function () {
		var columnTiles = this.getColumnTitles();
		var rows = this.getRows();
		var newRow = this.getNewRow();

		console.debug("Table render");
		return (
			<div>
        <table className="ui celled padded table">
        	<thead>
        		<tr>
							{columnTiles}
              <th>
                <button className="ui teal button"
                  disabled={this.state.hasNewRow ? "disabled" : ""}
                  onClick={this.insertRow}>
                  <i className="ui plus icon"></i>
                  新增
                </button>
              </th>
        		</tr>
        	</thead>
        	<tbody>
							{newRow}
							{rows}
        	</tbody>
        </table>
				</div>
		   )
		}
});

var Row = React.createClass({

	getInitialState : function() {
		return (
			{data : this.props.data}
		);
	},

	deleteClick : function() {
		this.props.onDeleteClick(this.state.data, this.props.key);
	},

	modifyClick : function() {
		this.props.onModifyClick(this.state.data, this.props.key);
	},

	saveClick : function () {
		this.props.onSaveClick(this.state.data, this.props.key);
	},

	cancelClick : function () {
		this.props.onCancelClick(this.state.data, this.props.key);
	},

	change : function (event) {
		var name = event.target.name;
		var value = event.target.value;
    var status = this.state.data._status;

    if(status == NEW) {
      status = NEW_MODIFY;
    }

		this.setState((prevState, props) => {
			var data = prevState.data;
			data[name] = value;
      data._status = status;
			return ({
				data : data
			});
		});
		//this.props.onChange(data, props.key);
	},

  generateRow : function(data) {
    var _this = this;
    return this.props.columns.map((col) => {
      // 获取对象的具体属性值
      var name = col.props.name;
      if(data._status == NEW) {
        data[name] = col.props.defaultValue;
      }
      var value = data[name];
      // 准备组件的参数
      var props = {
        value : value,
        status : data._status,
        readOnly : (data._status == MODIFY
          || data._status == NEW
          || data._status == NEW_MODIFY) ? false : true,
        onChange : _this.change
      }
      // Column
      var cell = React.cloneElement(col, props);
      return (
        <td>
          <div>
            {cell}
          </div>
        </td>)
    });
  },

  getButtons : function() {
    var status = this.props.data._status;
    if (status == MODIFY || status == NEW || status == NEW_MODIFY) {
      return(
        <td>
            <button className="ui orange button" onClick={this.saveClick}>
              <i className={status == NEW || status == NEW_MODIFY ?
                "add circle icon" : "edit icon"}></i>
              保存
            </button>
          <button className="ui button" onClick={this.cancelClick}>取消</button>
        </td>
      );
    }

    if (status != MODIFY && status != NEW && status != NEW_MODIFY) {
        return(
          <td>
            <button className="ui blue button" onClick={this.modifyClick}>
              <i className="edit icon"></i>
              修改
            </button>
            <button className="ui red button" onClick={this.deleteClick}>删除</button>
          </td>
      );
    }
  },

	render : function() {
		return(
        <tr>
          {this.generateRow(this.state.data)}
          {this.getButtons()}
        </tr>);

	}
});

var Input = React.createClass({

	getInitialState : function() {
		return {
			value : this.props.value
		}
	},
	handleChange : function(event) {
		if(this.props.onChange != null) {
			this.props.onChange(event);
		}
		//this.setState({value: event.target.value});
	},

	render : function() {
    var style = this.props.style;
		if(this.props.readOnly) {
      if(style == null) style = new Object();
      style.border = "1px solid rgba(0, 0, 0, 0.0)";
    }
		return (
			<input value = {this.props.value} name={this.props.name}
				onChange={this.handleChange} readOnly={this.props.readOnly && "readOnly"}
				style = {style}
			/>
		)
	}
});

/*
* name : 指定列的属性名（对象的属性，配合table才有用）
* displayName : 指定列的显示名（即列名）
* type : input/select/
* value : 显示值
* defaultValue ： 默认值（新增时）
* textplacehoder :
* canModify : true/ false true:不能变更值
*
*/
var Column = React.createClass({

  getDefaultProps : function () {

    return {
      readOnly : true,
      canModify : true,
      defaultValue : ''
    }
  },

  render : function () {
    var readOnly = this.props.readOnly;
    var status = this.props.status;
    var value = this.props.value;

    if(!this.props.canModify) {
      readOnly = true;
    }

    console.debug("column name:", this.props.name,
      " value:", value,
      " status:", status,
      " readOnly:", readOnly);

    return(
      <div className="ui input">
        <Input value={value} name={this.props.name}
            readOnly={readOnly} onChange={this.props.onChange} />
      </div>
    )
  }
});

var users = [
	{username : "admin", password : "123"},
	{username : "guest", password : "guest"},
]

var myRow = function(props) {
	return (
<tr key={props.data._key}>
			<td>
        <div className="ui input">
          <Input value={props.data.username} name={"username"}
  				    readOnly={props.readOnly} onChange={props.change} />
        </div>
      </td>
			<td>
        <div className="ui input">
          <Input value={props.data.password}  name={"password"}
				      readOnly={props.readOnly} onChange={props.change} />
        </div>
      </td>
      {props.buttons}
  </tr>
	);
}

$(document).ready(function() {
  ReactDOM.render(<Table datas={users} primaryKey={"username"} titles={["用户名", "密码"]}>
      <Column name={"username"} canModify={false} defaultValue={"hejianok"}/>
      <Column name={"password"} />
    </Table>, document.getElementById("container"));
});
