*** Settings ***
Library               SeleniumLibrary
Resource              ./resource/resource_car.robot
Test Teardown         Close All Browsers
*** Test Cases ***
TC01
    Open Browser         https://www.google.com/         Chrome