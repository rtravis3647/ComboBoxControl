# ComboBoxControl
An autocomplete enabled combo box control. Uses require.js and jQueryUI, but NOT a jQuery plugin.
You can use any type of source that the standard jquery autocomplete can use.

Usage:

var control = new ComboBox("div#comboId",{inputCSS:{"min-width":"0"},autocomplete:{source:"/ajax/combosource.php"}});
