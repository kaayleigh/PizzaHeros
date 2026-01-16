$(document).ready(function () {
    // Global Variables
    let cookingTime = 10; // Timer for pizza in the oven (in seconds)
    let cookingInterval; // Holds the reference to the cooking interval
    let levelScores = JSON.parse(sessionStorage.getItem('levelScores')) || { level1: 0, level2: 0, level3: 0, level4: 0 }; // Store scores per level

    // Local Variables
    let isButtonOn = false; // Indicates if the oven light is on (cooking state)
    let pizzaBurned = false; // Indicates if the pizza has burned
    let pizzaPerfectlyCooked = false; // Indicates if the pizza is cooked perfectly
    let ingredientsDropped = 0; // Counter for the number of ingredients dropped into the pizza
    let assemblyOrder = []; // Array to track the order of ingredients added to the pizza

    // Object to store selected ingredients by level
    let selectedIngredientsByLevel = {
        level1: [],
        level2: [],
        level3: [],
        level4: [],
    };

    // Load the player's avatar from session storage
    const playerAvatar = sessionStorage.getItem('playerAvatar'); // Retrieve the avatar path from sessionStorage
    if (playerAvatar) {
        $('#player-avatar').attr('src', playerAvatar); // Set the avatar image source to the stored avatar path
    }

    // Function to setup instruction functionality
    function setupInstructions() {
        $('#instructions-button').click(function () {
            // Display instructions based on the current page
            if (currentPage === 'index.html') {
                showInstructions("Welcome to Pizza Heroes!", "Collect the ingredients to make a perfect pizza! Click on the ingredients to select them.");
            } else if (currentPage === 'character.html') {
                showInstructions("Select Your Chef", "Choose from two different Chefs! Click on a Chef to select it.");
            } else if (currentPage === 'ingredient1.html') {
                showInstructions("Select Your Ingredients", "Pick the correct ingredients. Click on the ingredients to select them.");
            } else if (currentPage === 'assembly1.html') {
                showInstructions("Assemble Your Pizza", "Drag and drop the toppings onto the pizza! Remember to follow the order: Dough, Sauce, Cheese then Toppings.");
            } else if (currentPage === 'cooking.html') {
                showInstructions("Cooking Instructions!", "1. Click the start cooking button. <br> 2. Look at the timer! It shows how many seconds are left. <br> 3. If the timer goes below 4 seconds, your pizza might start to burn! <br> 4. Stop the timer before it hits 0 seconds, or your pizza will burn!");
            }
        });

        // Close instruction box functionality
        $(document).on('click', '#got-it, .close', function () {
            $('#instruction-box').fadeOut().addClass('hidden'); // Hide the instruction box when it's closed
        });
    }

    // Function to show instructions with a title and text
    function showInstructions(title, text) {
        $('#instruction-title').text(title); // Set the title of the instruction box
        $('#instruction-text').html(text); // Set the content text for the instruction box
        $('#instruction-box').removeClass('hidden').fadeIn(); // Show the instruction box
    }

    // Load selected ingredients from session storage, or default to empty selections
    selectedIngredientsByLevel = JSON.parse(sessionStorage.getItem('selectedIngredientsByLevel')) || selectedIngredientsByLevel;

    // Retrieve current page and level from URL
    const currentPage = window.location.pathname.split('/').pop(); // Get the current page name from the URL
    let currentLevel = parseInt(sessionStorage.getItem('currentLevel')) || 1; // Read current level from session storage, default to level 1

    // Level requirements for ingredients and the assembly order
    const levelRequirements = {
        level1: { ingredients: ['Dough', 'Sauce', 'Cheese', 'Tomato'], order: [1, 2, 3, 4] },
        level2: { ingredients: ['Dough', 'Sauce', 'Cheese', 'Pepperoni'], order: [1, 2, 3, 4] },
        level3: { ingredients: ['Dough', 'Sauce', 'Cheese', 'Hawaiian Ham', 'Pineapple'], order: [1, 2, 3, 4, 5] },
        level4: { ingredients: ['Dough', 'Sauce', 'Cheese', 'Ham', 'Mushroom', 'Olive'], order: [1, 2, 3, 4, 5, 6] },
    };

    // Initialize page settings when the script is loaded
    initIndexPage();

    // Setup event listeners for buttons related to instructions
    setupInstructions();

    // Check if the current page is the finished pizza screen for displaying results
    if (currentPage.includes('finishedpizza.html')) {
        showFinishedPizza(); // Display finished pizza information based on cooking results
        updateFinalScore(); // Update and show the final score
    }

    // Load ingredients on the assembly screen if applicable
    if ($('#assembly-screen').length) {
        loadAssemblyIngredients(); // Load ingredients related to the current level for assembly
    }

    // Set up event listeners for player interactions throughout the game
    setupEventListeners();
    updateScoreDisplay(); // Initialize and display the score

    // ------------------------------- Score Display Functions -------------------------------
    
    function displayScores() {
        // Function to display scores on the UI
        const currentScore = levelScores[`level${currentLevel}`]; // Get the score for the current level
        $('#current-level').text(currentLevel); // Display the current level number
        $('#level-score').text(currentScore); // Display the score for the current level
    
        // Show the current level score section in the interface
        $('#current-level-score').removeClass('hidden'); 
    
        // Check if the current level is the final level
        if (currentLevel === 4) {
            // Calculate total score only for the final level display
            const totalScore = Object.values(levelScores).reduce((sum, score) => sum + score, 0); // Sum scores from all levels
            $('#total-score-value').text(totalScore); // Display the total score
            $('#total-score').removeClass('hidden'); // Show the total score section in the interface
        } else {
            $('#total-score').addClass('hidden'); // Hide total score section for other levels
        }
    }

    // Call the function to display scores upon initialization
    displayScores(); // Call the function to display scores

    // ------------------------------- Initialization Functions -------------------------------
    
    function initIndexPage() {
        // Initialize variables and settings for the index page
        if (currentPage === 'index.html') {
            sessionStorage.setItem('currentLevel', 1); // Start at level 1
            currentLevel = 1; // Set current level to 1
            selectedIngredientsByLevel = { level1: [], level2: [], level3: [], level4: [] }; // Reset ingredients for all levels
            sessionStorage.setItem('selectedIngredientsByLevel', JSON.stringify(selectedIngredientsByLevel)); // Store empty ingredient selection in session storage
            selectedCharacter = null; // Reset selected character to null
            resetScoreForCurrentLevel(); // Reset the score for level 1
            updateScoreDisplay(); // Reset score display to show updated values
        } else {
            currentLevel = parseInt(sessionStorage.getItem('currentLevel')) || 1; // Read current level from session storage
        }
    }

    function resetScoreForCurrentLevel() {
        // Function to reset the score for the current level
        levelScores[`level${currentLevel}`] = 0; // Reset current level score to zero
        sessionStorage.setItem('levelScores', JSON.stringify(levelScores)); // Store updated scores in sessionStorage
    }

    // ------------------------------- Ingredient Selection Functions -------------------------------
    
    function resetIngredients() {
        // Function to reset selected ingredients and the score
        const pointsPerIngredient = 10; // Set the points deducted per dropped ingredient
        // Deduct the score based on the number of ingredients dropped
        levelScores[`level${currentLevel}`] -= ingredientsDropped * pointsPerIngredient; // Adjust score for the current level
        if (levelScores[`level${currentLevel}`] < 0) levelScores[`level${currentLevel}`] = 0; // Prevent negative score by setting it to zero
        sessionStorage.setItem('levelScores', JSON.stringify(levelScores)); // Update scores in sessionStorage
        updateScoreDisplay(); // Refresh displayed score
        // Reset the count of ingredients dropped
        ingredientsDropped = 0;

        // Provide feedback to the user regarding their attempt
        $('#assembly-feedback').text("Have another go, assemble the pizza correctly.").show(); 
        setTimeout(() => $('#assembly-feedback').hide(), 3000); // Hide feedback message after 3 seconds

        setTimeout(() => {
            location.reload(); // Reload the current page after delay
        }, 1000); // Reload the page after 1 second
    }

    // Character Selection Handler
    $('#character-options').on('click', '.character', function () {
        selectedCharacter = $(this).attr('alt'); // Get the name of the selected character
        const avatarPath = $(this).data('avatar'); // Get the image source from data attribute
        sessionStorage.setItem('playerAvatar', avatarPath); // Store the avatar path in session storage
        $(this).addClass('selected-character'); // Mark character as selected
        $('.character').not(this).hide(); // Hide other character options
        $('#next-screen').show(); // Show the button to continue to the next screen
    });

    // Update the score during ingredient selection
    function selectIngredient() {
        const ingredient = $(this).attr('alt'); // Get the ingredient name from the clicked element
        const levelKey = `level${currentLevel}`; // Create key for current level
        const requiredIngredients = levelRequirements[levelKey].ingredients; // Get the required ingredients for the current level

        // Initialize or update selected ingredients for the current level
        if (!selectedIngredientsByLevel[levelKey]) {
            selectedIngredientsByLevel[levelKey] = []; // Initialize selected ingredients if undefined
        }

        if ($(this).hasClass('selected-ingredient')) {
            $(this).removeClass('selected-ingredient'); // Deselect the ingredient if it was previously selected
            selectedIngredientsByLevel[levelKey] = selectedIngredientsByLevel[levelKey].filter(item => item !== ingredient); // Remove ingredient from the selected list
            levelScores[levelKey] -= 5; // Deduct 5 points for deselecting an ingredient
            sessionStorage.setItem('levelScores', JSON.stringify(levelScores)); // Update score in sessionStorage
            updateScoreDisplay(); // Update score display
        } else {
            if (requiredIngredients.includes(ingredient)) {
                $(this).addClass('selected-ingredient'); // Select the ingredient
                selectedIngredientsByLevel[levelKey].push(ingredient); // Add ingredient to the selected list
                showMessage("Great job! You've selected a correct ingredient!"); // Provide positive feedback
                levelScores[levelKey] += 5; // Add 5 points for correct ingredient selection
                sessionStorage.setItem('levelScores', JSON.stringify(levelScores)); // Update score in sessionStorage
                updateScoreDisplay(); // Update score display
            } else {
                showWrongSelectionFeedback($(this)); // Provide feedback for wrong selection
            }
        }

        // Save the selected ingredients in session storage
        sessionStorage.setItem('selectedIngredientsByLevel', JSON.stringify(selectedIngredientsByLevel));
    }

    // Function for displaying general messages to the user
    function showMessage(message) {
        $('#ingredient-feedback').text(message).css('display', 'block'); // Show the specified message in the UI
        setTimeout(() => {
            $('#ingredient-feedback').css('display', 'none'); // Hide message after a delay
            $('#ingredient-feedback').text(''); // Clear the message text
        }, 2000); // Time to display the message
    }

    // Function to navigate to the assembly screen
    function goToAssemblyScreen() {
        // Check if the ingredients selected are valid for the current level
        const selectedIngredientsForLevel = selectedIngredientsByLevel[`level${currentLevel}`] || []; // Get selected ingredients for the current level
        const requiredIngredients = levelRequirements[`level${currentLevel}`].ingredients; // Get required ingredients for the current level

        // Filter valid selected ingredients against required list
        const validIngredients = selectedIngredientsForLevel.filter(ingredient =>
            requiredIngredients.includes(ingredient) // Check inclusion in required ingredients
        );

        // Check if all required ingredients are selected for the assembly
        if (validIngredients.length === requiredIngredients.length) {
            sessionStorage.setItem('selectedIngredientsByLevel', JSON.stringify(selectedIngredientsByLevel)); // Save the selected ingredients
            window.location.href = `assembly${currentLevel}.html`; // Move to assembly page for the current level
        } else {
            showMessage('Select all the correct ingredients to continue!'); // Prompt user to select all required ingredients
        }
    }

    // Function to show feedback for wrong ingredient selections
    function showWrongSelectionFeedback($ingredientElement) {
        // Add visual feedback for wrong selections
        $ingredientElement.addClass('wrong-ingredient'); // Add class for visual feedback
        setTimeout(() => $ingredientElement.removeClass('wrong-ingredient'), 1000); // Remove class after 1 second

        // Display the message for the wrong selection
        showMessage("You picked the wrong ingredient! Please choose the correct ingredient."); // Utilize the showMessage function
    }

    // Function to load the necessary ingredients for the assembly process
    function loadAssemblyIngredients() {
        // Load the ingredients required for the current level
        const ingredientMapping = createIngredientMapping(); // Create a mapping of ingredients
        $('#ingredients').empty(); // Clear existing ingredient elements on the page

        const requiredIngredients = levelRequirements[`level${currentLevel}`].ingredients; // Get ingredients required for the current level
        requiredIngredients.forEach(ingredient => {
            // For each required ingredient, get its corresponding HTML element
            if (ingredientMapping[ingredient]) {
                const $ingredientDiv = $(ingredientMapping[ingredient]); // Create a jQuery object for the ingredient
                bindDragStart($ingredientDiv); // Bind drag start event handler
                $('#ingredients').append($ingredientDiv); // Append the ingredient element to the list of ingredients
            }
        });
    }

    // Function to create a mapping of ingredient names to their HTML structure
    function createIngredientMapping() {
        return {
            'Dough': '<div class="assembly draggable" id="pizza-base-draggable" data-target="pizza-base-drop" data-order="1" draggable="true"><img src="elements/toppings/pizzabase.png" alt="Pizza Base"><span>Pizza Base</span></div>',
            'Sauce': '<div class="assembly draggable" id="sauce-draggable" data-target="pizza-sauce-drop" data-order="2" draggable="true"><img src="elements/toppings/pizzasauce.png" alt="Sauce"><span>Sauce</span></div>',
            'Cheese': '<div class="assembly draggable" id="cheese-draggable" data-target="pizza-cheese-drop" data-order="3" draggable="true"><img src="elements/toppings/gratedcheese.png" alt="Cheese"><span>Cheese</span></div>',
            'Tomato': '<div class="assembly draggable" id="tomato" data-target="pizza-toppings-drop" data-order="4" draggable="true"><img src="elements/toppings/tomatoslices.png" alt="Tomato"><span>Tomato</span></div>',
            'Pepperoni': '<div class="assembly draggable" id="pepperoni" data-target="pizza-toppings-drop" data-order="4" draggable="true"><img src="elements/toppings/pepperonislices.png" alt="Pepperoni"><span>Pepperoni</span></div>',
            'Hawaiian Ham': '<div class="assembly draggable" id="hawaiian-ham" data-target="ham3-drop" data-order="4" draggable="true"><img src="elements/toppings/hamslices.png" alt="Hawaiian Ham"><span>Hawaiian Ham</span></div>',
            'Ham': '<div class="assembly draggable" id="ham2" data-target="ham2-drop" data-order="4" draggable="true"><img src="elements/toppings/hamslices2.png" alt="Ham"><span>Ham</span></div>',
            'Pineapple': '<div class="assembly draggable" id="pineapple" data-target="pineapple-drop" data-order="5" draggable="true"><img src="elements/toppings/pineappleslices.png" alt="Pineapple"><span>Pineapple</span></div>',
            'Mushroom': '<div class="assembly draggable" id="mushroom" data-target="mushroom-drop" data-order="5" draggable="true"><img src="elements/toppings/mushroomslices.png" alt="Mushroom"><span>Mushroom</span></div>',
            'Olive': '<div class="assembly draggable" id="olive" data-target="olive-drop" data-order="6" draggable="true"><img src="elements/toppings/oliveslices.png" alt="Olive"><span>Olive</span></div>',
        }; // Returns an object mapping ingredient names to their corresponding HTML element structures
    }

    // Function to bind drag start event for ingredients
    function bindDragStart($ingredientDiv) {
        // Bind event for when an ingredient starts being dragged
        $ingredientDiv.on("dragstart", function (e) {
            const targetId = $(this).data('target'); // Get the target dropzone ID from the data attribute
            e.originalEvent.dataTransfer.setData("targetId", targetId); // Store target ID in dataTransfer for drop handling
            e.originalEvent.dataTransfer.setData("text/plain", $(this).attr("id")); // Store the dragged element's ID for later use
            $(`#${targetId}`).removeClass('hidden'); // Make the target dropzone visible
        });
    }

    // ------------------------------- Event Listener Setup Functions -------------------------------
    
    function setupEventListeners() {
        // Set up event listeners for various game actions
        $('#start-button').click(startGame); // Start the game when the start button is clicked
        $('#next-screen').click(goToIngredientSelection); // Go to ingredient selection when the next button is clicked
        $('.ingredient-options').on('click', '.ingredient', selectIngredient); // Handle ingredient selection when an ingredient is clicked
        $('#go-to-assembly').on('click', goToAssemblyScreen); // Go to the assembly screen when the button is clicked
        $('#next-level').click(goToNextLevel); // Proceed to the next level when the next level button is clicked
        $('#reset-toppings').click(function () {
            resetIngredients(); // Call the reset logic for ingredients
        });

        // Event listener for the restart button on the finished pizza page
        $('#restart-button').click(function () {
            sessionStorage.clear(); // Clear all session storage to reset the game state
            window.location.href = 'index.html'; // Redirect to the start page for a new game
        });

        // If on the assembly screen, set up drag-and-drop functionality
        if ($('#assembly-screen').length) {
            setupDragAndDrop(); // Initialize drag-and-drop functionality
        }
    }

    // ------------------------------- Game Flow Functions -------------------------------    
    function startGame() {
        // Show the character selection screen at the start of the game
        $('#welcome-screen').hide(); // Hide the welcome screen
        $('#character-screen').show(); // Display the character selection screen
    }

    function goToIngredientSelection() {
        // Validate player inputs before proceeding to ingredient selection
        const playerName = $('#player-name').val(); // Get the player's name from input field
        let message = validateCharacterSelection(playerName); // Validate character selection

        if (message) {
            displayMessage(message); // Display any error messages returned from validation
        } else {
            // Store the player's name and redirect to the first ingredient selection screen
            sessionStorage.setItem('playerName', playerName);
            window.location.href = 'ingredient1.html'; // Redirect to the ingredient selection page
        }
    }

    function validateCharacterSelection(playerName) {
        // Validate the player's character selection and name entry
        let message = ""; // Initialize an empty message

        if (!playerName) {
            message = "Please enter your name!"; // Prompt for entering a name if left blank
        } else if (!$('.character.selected-character').length) {
            message = "Select your Chef!"; // Prompt if no character has been selected
        }

        return message; // Return any validation message for feedback
    }

    function displayMessage(message) {
        // Display a message in the UI and hide it after a timeout
        $('#character-feedback').text(message).show(); // Show the message to the user
        setTimeout(() => $('#character-feedback').hide(), 5000); // Automatically hide after 5 seconds
    }

    // ------------------------------- Drag and Drop Assembly Functions -------------------------------
    
    function setupDragAndDrop() {
        // Initialize drag-and-drop functionality for assembling the pizza
        $(".dropzone").on("dragover", function (e) {
            e.preventDefault(); // Prevent default behavior to allow dropping
            $(this).addClass('highlight'); // Highlight dropzone while dragging an item over it
        });

        $(".dropzone").on("drop", function (e) {
            e.preventDefault(); // Prevent default behavior on drop
            $(this).removeClass('highlight'); // Remove highlight from dropzone

            const draggedId = e.originalEvent.dataTransfer.getData("text/plain"); // Get the ID of the dragged element
            const draggedElement = $("#" + draggedId); // Select the dragged element based on its ID
            const dropzone = $(this); // Reference to the dropzone where the ingredient is being dropped
            const dropzoneId = dropzone.attr("id"); // Get the ID of the dropzone
            const targetId = e.originalEvent.dataTransfer.getData("targetId"); // Get the intended target ID of the drop

            processIngredientDrop(draggedElement, dropzone, dropzoneId, targetId); // Handle the drop action for the ingredient
        });
    }

    function processIngredientDrop(draggedElement, dropzone, dropzoneId, targetId) {
        const expectedOrder = parseInt(draggedElement.data('order')); // Get the expected order number of the dragged ingredient
        const currentOrder = ingredientsDropped + 1; // Determine the current order based on how many ingredients have been dropped

        // Handle settings when an ingredient is dropped onto a dropzone
        if (targetId === dropzoneId) {
            const ingredientImage = draggedElement.find('img').attr('src'); // Obtain the image source of the dragged ingredient
            dropzone.css('background-image', `url(${ingredientImage})`); // Set the dropped ingredient's image as the dropzone's background
            dropzone.css('background-repeat', 'no-repeat'); // Ensure the image does not repeat in the dropzone

            // Adjust background styles based on the type of ingredient
            if (draggedElement.attr('id') === 'pizza-base-draggable') {
                dropzone.css({
                    'background-size': '130%', // Scale base image for visual effect
                    'background-position': 'center' // Position the image at the center of the dropzone
                });
            } else {
                dropzone.css('background-position', 'center'); // Center background for other ingredients
            }

            draggedElement.addClass('ingredient-dropped'); // Mark the dragged ingredient as having been successfully dropped
            dropzone.addClass('filled'); // Mark the dropzone as filled

            // Check if the dropped ingredient is in the correct order
            if (expectedOrder === currentOrder) {
                assemblyOrder.push(expectedOrder); // Track the order of ingredients that were added correctly
                ingredientsDropped++; // Increase the count of ingredients dropped
                levelScores[`level${currentLevel}`] += 10; // Add scores for successfully dropping an ingredient
                $('#assembly-feedback').text("Nice! Add the next ingredient.").show(); // Provide feedback for the next step
                
                sessionStorage.setItem('levelScores', JSON.stringify(levelScores)); // Save updated scores in sessionStorage
                updateScoreDisplay(); // Update displayed score
                
                let requiredOrder = levelRequirements[`level${currentLevel}`].order; // Get the required order for the current level
                checkAssemblyCompletion(requiredOrder); // Check if the assembly is complete
            } else {
                dropzone.removeClass('filled'); // Mark dropzone as unfilled if the order is incorrect
                $('#assembly-feedback').text("Wrong order! Please reset the toppings.").show(); // Feedback for incorrect order
            }
        } else {
            $('#assembly-feedback').text("That's not the right spot!").show(); // Feedback for incorrect drop location
        }
    }

    function checkAssemblyOrder() {
        // Check if the order of ingredients dropped matches the required order
        return JSON.stringify(assemblyOrder) === JSON.stringify(levelRequirements[`level${currentLevel}`].order); // Compare orders as JSON strings
    }

    // ------------------------------- Cooking Functions -------------------------------
    
    $('#go-to-cooking').on('click', function () {
        // Handle the transition to the cooking stage
        let requiredOrder = levelRequirements[`level${currentLevel}`].order; // Acquire the required order for this level

        // Check if the correct number of ingredients have been dropped and in the right order
        if (ingredientsDropped === requiredOrder.length && checkAssemblyOrder()) {
            $('#assembly-feedback').text("Your pizza is ready! Moving to the oven.").show(); // Feedback message before transitioning
            setTimeout(() => window.location.href = `cooking.html`, 2000); // Navigate to the cooking page after 2 seconds
        } else {
            // Prompt user if the assembly is not complete
            $('#assembly-feedback').text("Finish building your pizza before baking!").show(); // Alert to finish the assembly first
        }
    });

    // Cooking Functions
    $('#finish-cooking').click(function () {
        // Toggle the cooking button on click
        if (!isButtonOn) {
            $(this).text('Stop Cooking');  // Change button text to 'Stop Cooking'
            isButtonOn = true;             // Update button’s state to "on"
            startCooking();                 // Start the cooking process
        } else {
            $(this).text('Start Cooking');  // Change back button text to 'Start Cooking'
            isButtonOn = false;             // Update button’s state back to "off"
            stopCooking();                  // Stop the cooking process
        }
    });

    function startCooking() {
        // Start the cooking process with initial settings
        $('#oven-light .oven-off').hide(); // Hide the off light indicator to indicate cooking has started
        $('#oven-light .oven-on').show();  // Show the on light indicator
        $('#timer').text(cookingTime);      // Display the initial cooking time on the timer
        clearMessages();                    // Clear any previous messages that may be displayed
        pizzaBurned = false;                // Reset burned state to false
        pizzaPerfectlyCooked = false;       // Reset perfect pizza state to false

        // Start the cooking countdown
        cookingInterval = setInterval(function () {
            cookingTime--;                   // Decrement cooking time by 1 second
            $('#timer').text(cookingTime);  // Update the timer's displayed value

            // Show warning if cooking time reaches a critical limit
            if (cookingTime <= 4 && cookingTime > 0) {
                clearMessages(); // Clear any existing messages
                $('#burning').show(); // Show warning message indicating the pizza might burn
            }

            // Check if cooking time has run out
            if (cookingTime <= 0) {
                pizzaBurned = true;          // Mark the pizza as burned
                clearInterval(cookingInterval); // Stop the cooking interval
                $('#oven-light .oven-on').hide(); // Hide the on light
                $('#oven-light .oven-off').show(); // Show the off light indicating cooking has stopped
                $('#finish-cooking').hide();       // Hide the finish button as cooking has ended
                clearMessages();                   // Clear all messages displayed
                $('#burned').show();               // Show burned message to the user

                // Redirect to the finished pizza screen after a delay
                setTimeout(function () {
                    sessionStorage.setItem('pizzaPerfectlyCooked', pizzaPerfectlyCooked);
                    window.location.href = 'finishedpizza.html'; // Redirect to finish screen
                }, 1000); // Wait for 1 second before redirecting
            }
        }, 1000); // This function executes every second (1000 milliseconds)
    }

    function stopCooking() {
        // Stop the cooking process and handle the outcomes
        clearInterval(cookingInterval); // Stop the cooking timer interval
        $('#oven-light .oven-on').hide(); // Hide the on light
        $('#oven-light .oven-off').show(); // Show the off light
        clearMessages(); // Clear any messages displayed to the user

        // Check if the pizza is burned and adjust scores accordingly
        if (pizzaBurned) {
            levelScores[`level${currentLevel}`] -= 30; // Deduct points if the pizza is burned
            $('#burned').show(); // Show burned message
            navigateToFinishedPizza(); // Proceed to the finished pizza screen
        } else if (cookingTime > 3) {
            $('#undercooked').show(); // Show message for undercooked pizza
        } else if (cookingTime <= 3 && cookingTime > 0) {
            pizzaPerfectlyCooked = true; // Mark pizza as perfectly cooked
            levelScores[`level${currentLevel}`] += 30; // Add points for perfect cooking
            $('#complete').show(); // Show completion message
            navigateToFinishedPizza(); // Redirect to the finished pizza screen
        }

        // Store results of cooking in session storage
        sessionStorage.setItem('pizzaPerfectlyCooked', pizzaPerfectlyCooked);
        sessionStorage.setItem('levelScores', JSON.stringify(levelScores)); // Save updated scores in session storage
        updateScoreDisplay(); // Refresh score display
    }
    
    function navigateToFinishedPizza() {
        // Function to redirect to the finished pizza screen with a delay
        setTimeout(() => {
            window.location.href = 'finishedpizza.html'; // Redirect to the finished pizza screen
        }, 1000); // Wait for 1 second before navigating
    }

    function clearMessages() {
        // Hide messages displayed to the user so they don't clutter the interface
        $('#burning').hide();
        $('#burned').hide();
        $('#complete').hide();
        $('#undercooked').hide();
    }

    // ------------------------------- Level Management Functions -------------------------------
    
    function goToNextLevel() {
        // Function to progress to the next level
        currentLevel++; // Move to the next level
    
        // Check if there are more levels to proceed to
        if (currentLevel <= 4) {
            sessionStorage.setItem('currentLevel', currentLevel); // Save the updated level in session
            displayScores(); // Call function to display the updated scores
            window.location.href = `ingredient${currentLevel}.html`; // Redirect to the ingredient selection screen for the new level
        } else {
            updateFinalScore(); // Function to update final score when exiting to the finish screen
            window.location.href = 'finishedpizza.html'; // Redirect to the finish screen after completing all levels
        }
    }

    // ------------------------------- Final Pizza Status Functions -------------------------------
    
    function showFinishedPizza() {
        // Show finished pizza based on the cooking outcome
        const level = parseInt(sessionStorage.getItem('currentLevel')) || 1; // Get the current level from session storage
        const isPerfect = sessionStorage.getItem('pizzaPerfectlyCooked') === 'true'; // Check if the pizza was perfectly cooked
        updatePizzaVisibility(level, isPerfect); // Update pizza display according to cooking results

        // Check if the current level is the last level (4)
        if (level === 4) {
            $('#next-level').hide(); // Hide the next level button if it exists
            $('#restart-button').show(); // Show the restart button for the final level
        } else {
            $('#next-level').show(); // Show the next level button if not on the last level
            $('#restart-button').hide(); // Hide the restart button if not on the last level
        }
        $('#current-level').text(level); // Ensure this displays the current level to the user
    }

    function updatePizzaVisibility(level, isPerfect) {
        // Display the appropriate pizza image based on level and cooking outcome
        $('#pizza-image img').addClass('hidden'); // Hide all pizza images initially
        const pizzaId = isPerfect ? `#pizza-perfect-${level}` : `#pizza-burned-${level}`; // Determine pizza ID based on cook status
        $(pizzaId).removeClass('hidden'); // Show the resulting pizza image, either burned or perfect
    }

    function updateScoreDisplay() {
        // Function to update and display the current score for the user
        const currentLevelScore = levelScores[`level${currentLevel}`]; // Get the score for the current level
        $('#score').text(`Score: ${currentLevelScore}`); // Update the score text in the UI
    }
    
    function updateFinalScore() {
        // Function to calculate and display the final score at the end of the game
        const finalScore = Object.values(levelScores).reduce((acc, val) => acc + val, 0); // Sum all level scores for the final score
        $('#total-score-value').text(finalScore); // Display the total score in the UI
        $('#total-score').removeClass('hidden'); // Ensure the total score section is visible to the user
    }
});