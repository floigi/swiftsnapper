﻿/// <reference path="SC/snapchat.ts" />
/// <reference path="cameraManager.ts" />
/// <reference path="typings/winrt/winrt.d.ts" />
/// <reference path="typings/jquery/jquery.d.ts" />
/// <reference path="typings/es6-promise/es6-promise.d.ts" />
declare var Handlebars: any;
let views;

module swiftsnapper {
    "use strict";

    let SnapchatClient: Snapchat.Client;



    export module Application {
        export function initialize() {
            document.addEventListener('deviceready', onDeviceReady, false);
            initializeStatusBar();
        }

        export function initializeStatusBar() {
            if (typeof Windows !== 'undefined') {
                let theme = {
                    a: 255,
                    r: 52,
                    g: 152,
                    b: 219
                }, v = Windows.UI.ViewManagement.ApplicationView.getForCurrentView();

                v.titleBar.inactiveBackgroundColor = theme;
                v.titleBar.buttonInactiveBackgroundColor = theme;
                v.titleBar.backgroundColor = theme;
                v.titleBar.buttonBackgroundColor = theme;
                v['setDesiredBoundsMode'](Windows.UI.ViewManagement['ApplicationViewBoundsMode'].useCoreWindow);
                v['setPreferredMinSize']({
                    height: 1024,
                    width: 325
                });
            }

            if (typeof Windows.UI.ViewManagement['StatusBar'] !== 'undefined') {
                $('body').addClass('mobile');
                let statusBar = Windows.UI.ViewManagement['StatusBar'].getForCurrentView();
                statusBar.showAsync();
                statusBar.backgroundOpacity = 1;
                statusBar.backgroundColor = Windows.UI.ColorHelper.fromArgb(255, 52, 152, 219);
                statusBar.foregroundColor = Windows.UI.Colors.white;

                //Lock portrait
                Windows.Graphics.Display['DisplayInformation'].autoRotationPreferences = Windows.Graphics.Display.DisplayOrientations.portrait
            }
        }

        function onDeviceReady() {
            // Handle the Cordova pause and resume events
            document.addEventListener('pause', onPause, false);
            document.addEventListener('resume', onResume, false);
        }

        function onPause() {
            // TODO: This application has been suspended. Save application state here.
        }

        function onResume() {

        }

    }

    window.onload = function () {
        Application.initialize();

        //Init Snapchat
        SnapchatClient = new Snapchat.Client();
        SnapchatClient.Initialize().then(function () {
            $(document).ready(function () {
                $('body').load('views/account/index.html');
            });
        });
    }

    export function onAccountView() {
        //Init Owl Carousel
        views = $('#views');
        views.owlCarousel({
            loop: false,
            nav: false,
            dots: false,
            video: true,
            margin: 0,
            startPosition: 1,
            mouseDrag: false,
            touchDrag: false,
            pullDrag: false,
            fallbackEasing: 'easeInOutQuart',
            items: 1,
        });

        $('header').on('click tap', function () {
            views.trigger('to.owl.carousel', [1, 300, true]);
        });
        $('#LogInBtn').on('click tap', function () {
            views.trigger('next.owl.carousel', [300]);
        });
        $('#SignUpBtn').on('click tap', function () {
            views.trigger('prev.owl.carousel', [300]);
        });

        $('#LogInForm').submit(function (e) {
            $('#LogInView form .username').prop("disabled", true);
            $('#LogInView form .password').prop("disabled", true);

            SnapchatClient.Login({
                username: $('#LogInView form .username').val(),
                password: $('#LogInView form .password').val(),
            }).then(
                function (data) {
                    if (typeof data['code'] !== 'undefined' && data['code'] !== 200) {

                        //TODO
                        $('#LogInView form .username').prop("disabled", false);
                        $('#LogInView form .password').prop("disabled", false);
                        return -1;
                    }

                    $(document).ready(function () {
                        $('body').load('views/overview/index.html');
                    });
                });

            e.preventDefault();
        });
    }

    export function onOverviewView() {
        //TODO: use data from
        var lang = {
            app: {
                name: 'SwiftSnapper'
            },
            snaps: {
                double_tap_to_reply: 'Double tap to reply',
                day_ago: 'day ago',
                days_ago: 'days ago',
                just_now: 'just now',
            },
            stories: {
                title: 'Stories',
                discover: 'Discover',
            }
        };

        var template = Handlebars.compile($("#template").html());
        $('#PageContent').html(template(lang));

        //Init Owl Carousel
        views = $('#views');
        views.owlCarousel({
            loop: false,
            nav: false,
            dots: false,
            video: true,
            margin: 0,
            startPosition: 1,
            pullDrag: false,
            fallbackEasing: 'easeInOutQuart',
            responsive: {
                0: {
                    items: 1
                },
                1024: {
                    items: 3
                }
            }
        });

        //temp: view unread snaps
        var snaps = SnapchatClient.GetPendingFeed()
        for (var n = 0; n < snaps.length; n++) {
            let snap = snaps[n],
                output =
                    '<article class="item"><div class="notify snap"><span class="icon mdl2-checkbox-fill"></span></div><div class="details">' +
                    '<div class="header">' + snap.sender + '</div>' +
                    '<div class="details">Length: ' + snap.timer.toString() + '</div>' +
                    '</div></article>';

            $('#SnapsView .SnapsList').append(output);
        }

        CameraManager.initialize({
            'frontFacing': false
        });

        $('#ViewSnapsBtn').on('click tap', function () {
            views.trigger('prev.owl.carousel', [300]);
        });
        $('#ViewStoriesBtn').on('click tap', function () {
            views.trigger('next.owl.carousel', [300]);
        });

        $('#CameraToggleBtn').on('click tap', function () {
            if ($('#CameraPreview').hasClass('FrontFacing')) {
                CameraManager.initialize({
                    'frontFacing': false
                });
            } else {
                CameraManager.initialize({
                    'frontFacing': true
                });
            }

        });
        $('#ShutterBtn').on('click tap', function () {
            CameraManager.takePhoto();
        });


        if (typeof Windows !== 'undefined' && Windows.Foundation.Metadata['ApiInformation'].isTypePresent('Windows.Phone.UI.Input.HardwareButtons')) {
            Windows['Phone'].UI.Input.HardwareButtons.addEventListener('camerapressed', function (e) {
                $('#ShutterBtn').click();
            });
        }
    }
}
