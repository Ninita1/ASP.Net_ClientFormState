## ASP.Net - Client Form State Manager

When customers decide to complicate, they are the best at it. In addition to requesting a session control that allows them to work several hours without stopping, they can also ask the platform to reopen on exactly the same page, exactly the same tab, exactly the same partial view, and exactly the same data the form owned before it was closed.

With platforms developed in Angular or React (for example) this would be simpler due to their state managers of each scope and using for example Redux. But in an ASP.Net Web Platform project, it's not that simple.

The biggest problem is the platform architecture. In a simple project it would be enough to ensure that the last opened page was reopened and save the form data. However, when the customer actually asks for something as described above, it is best to prepare for some unnecessary headaches.

In this repository is a solution to one of these complex cases. The solution is designed to be as generic as possible but may need to be adapted to the reality of the project concerned.


# Dependencies:
- jQuery
- formSaver.js

# Steps:

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
           

