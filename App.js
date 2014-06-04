
Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    
    items:[ 
        {xtype:'container', itemId:'selector_box', layout: { type:'hbox'} },
        {xtype:'container',itemId:'feature_box',tpl:"<tpl>Feature chosen: {FormattedID}:{Name}</tpl>" },
        {xtype:'container',itemId:'display_box'}
    ],
    
    launch: function() {
        
        this.down('#selector_box').add({
            xtype:'rallybutton',
            text:'Choose Feature',
            margin: 5,
            listeners: {
                scope: this,
                click: function(){
                    this._showFeatureChooser();
                }
            }
        });
       
        // add an empty separator
        this.down('#selector_box').add({xtype:'container',width: 100});
        
        
        //load the full contents of feature
        
        //create the custom store for the rev history
        //get the revision history
        //create the grid
        //populate the grid
      
        
    },
    _showFeatureChooser: function(){
        console.log('here we are-showFeatureChooser');
        Ext.create('Rally.ui.dialog.ChooserDialog',{
            artifactTypes:['portfolioitem/feature'],
            autoShow: true,
            title:'Feature Chooser',
            listeners: {
                scope: this,
                artifactChosen: function(selected_record){
                    var feature_data = null;
                    if ( selected_record ) { feature_data = selected_record.getData(); }
                    this.feature = selected_record;
                    
                    this.down('#feature_box').update(feature_data);
                    this._addCalendarBox();
                }
            }
        });
    },
    _addCalendarBox: function() {
        if ( this.calendar_box ) { this.calendar_box.destroy(); }
        
        this.calendar_box = this.down('#selector_box').add({
            xtype: 'rallydatefield',
            fieldLabel: 'From Date',
            listeners: {
                scope: this,
                change: function(datebox, value) {
                    console.log('date', value);
                    this.selected_date = value;
                    this._loadFeatureData(this.feature);
                    //this._prepareRevisionHistory();
                }
            }
        }).setValue(new Date());
    },
    _loadFeatureData: function(feature){
       console.log('here we are-loadFeatureData');
       Ext.create('Rally.data.WsapiDataStore', {
           model: 'portfolioitem',
           autoLoad: true,
           filters: [{property: 'FormattedID', value: feature.get('FormattedID')}],
           fetch: ['Name','RevisionHistory','Revisions', 'CreationDate', 'Description', 'User'],
           listeners: {
                scope: this,
                load: function(store, items) {
                    console.log(items);
                    var revStore = this._loadRevisionHistory(items);
                    
                }
           }
           
       });
    },
    _loadGrid: function(store) {
        console.log('here we are-loadGrid');
        if ( this.grid ) { this.grid.destroy(); }
        
        this.grid = this.down('#display_box').add({
            xtype:'rallygrid',
            store: store,
            columnCfgs: [
                {text: 'Description', dataIndex: 'Description', flex: 1, renderer: function(value,metadata,record,colindex,rowindex) {
//                    if ( /USERSTORIES/.test(value) ){
//                        metadata.style="background-color: yellow;";
//                    }
                    return value;
                }},
                {text: 'Date', dataIndex: 'CreationDate', renderer: function(value){
                    return value.replace(/T.*$/,"");
                }},
                {text: 'User', dataIndex: 'User', renderer: function(value, metadata, record){
                    return value._refObjectName;
                    }
                }
            ]
        });
    },
    _loadRevisionHistory: function(features){
        console.log('here we are-loadRevisionHistory');
        var revRows = [];
        Ext.Array.each(features, function(feature){
            console.log('rev history', feature.get('RevisionHistory').Revisions);
            Ext.Array.each(feature.get('RevisionHistory').Revisions, function(revision){
                revRows.push(revision);
            });
        });
        
        this.revRows = revRows;
        this._prepareRevisionHistory();
    },
    _prepareRevisionHistory: function() {
        console.log('_prepareRevisionHistory', this.revRows);
        var me = this;
        
        var filtered_rows = [];
        Ext.Array.each( this.revRows, function(rev_row){
            rev_row.ShortDate = rev_row.CreationDate.replace(/T.*$/,"");
            
            console.log('short date',rev_row.ShortDate);
            if ( me.selected_date ){
                var iso_selected_date = Rally.util.DateTime.toIsoString(me.selected_date);
                if ( rev_row.CreationDate.localeCompare(iso_selected_date) > -1 ) {
                    if ( me._keepBasedOnDescription(rev_row.Description) ) {
                        filtered_rows.push(rev_row);
                    }
                }
            } else {
                    filtered_rows.push(rev_row);
            }
        });
        
        var revHistoryStore = Ext.create('Rally.data.custom.Store',{
            sorters: [ { property: 'CreationDate', direction: 'ASC' }],
            data: filtered_rows
        });

        
        
        this._loadGrid(revHistoryStore);
    },
    _keepBasedOnDescription:function(description) {
        return /USERSTORIES/.test(description);
    }
});
