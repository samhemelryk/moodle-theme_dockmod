/**
 * This function modifies the dock as we want.
 * 
 * In our case we are choosing to extend the dock rather than modify it.
 * To do this we listen for a couple of the events that the dock fires and when
 * fired we make any changes we want.
 * 
 * The function itself gets called by the dock during its initialisation.
 * This means that you have access to everything the dock has.
 */
function customise_dock_for_theme() {
    var dock = M.core_dock;
    // If you want to fix the position of the dock and not allow it to be moved
    // then you should uncomment the applicable lines below and comment out the
    // two lines in this function that start with dock.on(...
    // You can also remove all the other JS in this file if you wish :)

    // dock.cfg.position = 'left';
    // dock.cfg.position = 'right';
    // dock.cfg.position = 'top';
    // dock.cfg.orientation = 'horizontal';
    // dock.cfg.orientation = 'horizontal';
    
    // We attach an event listener to the dock:initialised event so that when the
    // dock is finished initialising our initialise_mod function is called.
    dock.on('dock:initialised', M.theme_dockmod.initialise_mod);
    // Then we attach an event listener to the resizepanelcomplete event. The dock
    // fires this event when the panel is resized. This can happen because the
    // content has changed or the user has resized the browser.
    // When this fires we want to call our handle_resize function to fix any
    // display errors.
    dock.on('dock:resizepanelcomplete', M.theme_dockmod.handle_resize);
}

/**
 * Next we create a namespace on the M global to hold a couple of functions
 * and variables that we require.
 * We do this because we can easily access them later as we know exactly where
 * they are.
 */
M.theme_dockmod = {
    /** This is the current position of the block */
    place : 0,
    /** These are the positions the block can have */
    moves : [['left', 'vertical'],
             ['top', 'horizontal'],
             ['right', 'vertical']]
};

/**
 * This function initialises out modifications within the dock.
 * It gets called once the dock has finished initialising itself, at this point
 * it is safe to make any changes we want.
 * 
 * The primary use of this function is to create a button at the end of the dock
 * that the user can click to move the dock from one position to another.
 * Once we have created this button we attach a click event so that when the user
 * clicks the button the M.theme_dockmod.move_dock function is called.
 */
M.theme_dockmod.initialise_mod = function() {
    var dock = M.core_dock;
    var create  = dock.Y.Node.create;
    // Create the button
    var movebtn = create('<img alt="'+M.str.block.undockall+'" title="Move dock" class="movedockbutton" />');
    movebtn.setAttribute('src', M.util.image_url('move_dock', 'theme_dockmod'));
    // Add the button to the dock
    dock.nodes.buttons.one('.'+dock.css.controls).insert(movebtn, 0);
    // Attach the click event to call move_dock
    movebtn.on('click', M.theme_dockmod.move_dock);
}

/**
 * This function checks whether we need to fix any display errors when the resize
 * event has been fired.
 * 
 * The primary thing to do here is to make some adjustments to the dock if it
 * is horizontal rather than vertical as the current dock doesn't handle
 * horizontal display by itself.
 */
M.theme_dockmod.handle_resize = function() {
    var dock = M.core_dock;
    // We only need to do stuff if its horizontal
    if (dock.cfg.orientation == 'horizontal' && dock.cfg.position == 'top') {
        var panel = dock.getPanel();
        var item = dock.getActiveItem();
        // Check its visible no point doing anything if its not.
        if (panel.visible === false || typeof(item) !== 'object') {
            return;
        }
        var buffer = dock.cfg.buffer;
        var screenheight = parseInt(dock.nodes.body.get('winHeight'))-(buffer*2)-dock.nodes.dock.get('offsetHeight');
        var scrolltop = panel.contentBody.get('scrollTop');
        // Reset the height of the panel so that we can accurately measure it
        panel.contentBody.setStyle('height', 'auto');
        // Remove the oversized class if it is there.
        panel.removeClass('oversized_content');
        var panelheight = panel.get('offsetHeight');
        // Set the height of the panel if required and add the oversized class
        if (panelheight > screenheight) {
            panel.contentBody.setStyle('height', (screenheight - panel.contentHeader.get('offsetHeight'))+'px');
            panel.addClass('oversized_content');
        }
        // Set the scrolltop of the panel to what it was before we started.
        if (scrolltop) {
            panel.contentBody.set('scrollTop', scrolltop);
        }
    }
}

/**
 * This function is reposible for moving the dock and gets fired when the user
 * clicks the button that we created.
 * 
 * Essentially all this function does is move the dock from one position to the
 * next, and then corrects the orientation of the titles in the navigation.
 */
M.theme_dockmod.move_dock = function (ev) {
    var dock = M.core_dock;
    // Work out the current class on the body tag for the position of the dock.
    var oldclassname = dock.css.body+'_'+dock.cfg.position+'_'+dock.cfg.orientation;
    // Work out the next place of the dock
    M.theme_dockmod.place = (M.theme_dockmod.place + 1) % 3;
    // Get the paramenters for the next place
    var move = M.theme_dockmod.moves[M.theme_dockmod.place];
    // Set change the dock parameters to the new parameters
    dock.cfg.position    = move[0];
    dock.cfg.orientation = move[1];
    // Work out the new class name to get the body
    var newclassname = dock.css.body+'_'+dock.cfg.position+'_'+dock.cfg.orientation;
    // Replace the old class with the new class.
    dock.nodes.body.replaceClass(oldclassname, newclassname);

    // Here we need to iterate each item on the dock and correct the title 
    // orientation. To do this we remove the title and then add a fixed one back.
    var items = dock.items;
    for (var i in items) {
        var item = items[i];
        item.title = document.createElement(item.title.nodeName);
        dock.fixTitleOrientation(item, item.title, item.titlestring.firstChild.nodeValue);
        item.nodes.docktitle.get('children').remove();
        item.nodes.docktitle.append(item.title);
    }
}