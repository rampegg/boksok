var compound = {
    el: '#app',
    data: {
        searchWord: "",
        rawItems: [],
    },
    computed: {
        items: function() {
            console.log("eeh")
            return this.rawItems
        }
    },
    methods: {
        search: function(e) {
            e.preventDefault();
            let self = this
            $.ajax({
                url: "/books/" + this.searchWord
            }).done(function(data) {
                self.rawItems = data
            })
        }
    }
}
var app = new Vue(compound)