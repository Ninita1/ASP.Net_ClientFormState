# ASP.Net - Client Form State Manager

When customers decide to complicate, they are the best at it. In addition to requesting a session control that allows them to work several hours without stopping, they can also ask the platform to reopen on exactly the same page, exactly the same tab, exactly the same partial view, and exactly the same data the form owned before it was closed.

With platforms developed in Angular or React (for example) this would be simpler due to their state managers of each scope and using for example Redux. But in an ASP.Net Web Platform project, it's not that simple.

The biggest problem is the platform architecture. In a simple project it would be enough to ensure that the last opened page was reopened and save the form data. However, when the customer actually asks for something as described above, it is best to prepare for some unnecessary headaches.

In this repository is a solution to one of these complex cases. The solution is designed to be as generic as possible but may need to be adapted to the reality of the project concerned.


## Dependencies:
- jQuery
- formSaver.js

## Steps:

1. On the html document `<head>` include the `formSaver.js` and `AppState.js` scripts, and call the `AppState.LoadPlatform()` on document ready:

        <!DOCTYPE html>
        <html>
        <head>
            <!--bla bla bla-->

            <script src="@Url.Content("~/Scripts/jquery.formsaver.js")"></script>
            <script src="@(Url.Content("~/Scripts/AppState.js") + "?" + DateTime.Now.ToString("yyyyMMdd"))"></script>    
        </head>
        <body id="MyApp">

            <script type="text/javascript">

                $(document).ready(function () {
                    AppState.LoadPlatform();
                });

            </script>
            
            <!--bla bla bla-->
        </body>
 
 
2. On each page you need this state manager call the `AppState.LoadPage()` method on document ready. Depending of your code, maybe your need to consider using promises:

        $.when(loadPage(), loadSomethingElse()).done(function () {
            AppState.LoadPage();
        });
        
 
3. If your page open a partial view, please call the `AppState.LoadPartialPage()` method on the partial view document ready.


4. On every click event to start something that you want to remember, call the:

        AppState.AddPageClick($(this)); //if you click on a button and you want to simulate that click
        
        //or
        
        AppState.AddPageClick(bt, MethodWhereIsCalled, urlAction); //if you simply want to remember after a ajax success and it must be inside a function.


On the second case the `bt` property is a reference to the element that called the function with the ajax request and `urlAction` is the URL to be called by the ajax request. The `MethodWhereIsCalled` is the function where this ajax request exists.

For example:


    $(document).ready(function () {
                
        $("#new_repository").on("click", function (e) {
            e.preventDefault();

            var urlAction = 'https://github.com/create';            
            CallMyPartialPage(urlAction, $(this));
        });
        
        if (!isStringEmpty(repositoryToOpen)) //open a specific item details on document ready
        {            
            var urlAction = 'https://github.com/details?id=' + repositoryToOpen;
            CallMyPartialPage(urlAction, null);
        }

        AppState.LoadPartialPage();
    });

    function CallMyPartialPage(urlAction, bt)
    {
        $('#loadingModal').modal('show');

        $.ajax({
            type: "GET",
            contentType: "application/json; charset=utf-8",
            url: urlAction,
            async: true,
            success: function (data) {

                if (data.hasErro) {
                    $('#errorMessage').text(data.Erro);
                    $('#errorModal').modal('show');
                }
                else {
                    AppState.AddPageClick(bt, CallMyPartialPage, urlAction);

                    //some code
                }
                $('#loadingModal').modal('toggle');
            },
            error: function (data) {
                $('#errorMessage').text("An error occured posting the call to the server. Please verify your connection and try again.");
                $('#loadingModal').modal('toggle');
                $('#errorModal').modal('show');
            }
        });
    }


5. On every click event to end/cancel something that you want to remember, call the `AppState.CancelLastPageClick()` method. It will make the state manager to  forget the last click registered. For example:

            $("#openModalToCreate").on("click", function (e) {
                e.preventDefault();
                var bt = this;

                $('#loadingModal').modal('show');
                $.ajax({
                    type: "GET",
                    contentType: "application/json; charset=utf-8",
                    url: 'https://github.com/createInModal',
                    async: true,
                    success: function (data) {
                        $('#loadingModal').modal('toggle');
                        if (data.hasErro) {

                            $('#errorMessage').text(data.Erro);
                            $('#errorModal').modal('show');
                        } else {

                            AppState.AddPageClick($(bt), null, null, true);

                            $('#generalModal .modal-content').html(data);
                            $('#generalModal').modal('show');

                            $('#generalModal').unbind('hidden.bs.modal').on('hidden.bs.modal', function () {
                                AppState.CancelLastPageClick();
                            });
                        }
                    },
                    error: function () {
                        $('#errorMessage').text("An error occured posting the call to the server. Please verify your connection and try again.");
                        $('#loadingModal').modal('toggle');
                        $('#errorModal').modal('show');
                    }
                });
            });

