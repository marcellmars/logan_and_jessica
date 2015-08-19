:runner:Jessica invites :runner:Logan to run together...
========================================================


  * [Geolocation discrimination](#geolocation-discrimination)
  * [How Jessica lets Logan run](#how-jessica-lets-logan-run)
   * [1) Jessica sets up a tunnel for Logan.](#1-jessica-sets-up-a-tunnel-for-logan)
   * [2) Jessica copies the URL for Logan.](#2-jessica-copies-the-url-for-logan)
   * [3) Jessica sends the URL to Logan.](#3-jessica-sends-the-url-to-logan)
   * [4) Logan opens the URL sent by Jessica.](#4-logan-opens-the-url-sent-by-jessica)
   * [5) In extension popup Logan clicks [VIA JESSICA].](#5-in-extension-popup-logan-clicks-via-jessica)
   * [6) Logan's Chrome extension opens up pinned tab and establishes the tunnel to Jessica.](#6-logans-chrome-extension-opens-up-pinned-tab-and-establishes-the-tunnel-to-jessica)
   * [7) From now on Logan gets tunneled to the internet through Jessica's computer and IP address.](#7-from-now-on-logan-gets-tunneled-to-the-internet-through-jessicas-computer-and-ip-address)
   * [8) Jessica gets notification that Logan is running through her tunnel.](#8-jessica-gets-notification-that-logan-is-running-through-her-tunnel)

Geolocation discrimination
==========================

In the common scenario of surfing the Internet today your personal computer automatically gets its own LAN IP address from the router (usually WiFi) which has its own public IP address (again usually automatically assigned by your Internet Serice Provider at the given moment). In other words: the public IP address has been assigned to your router after the router asked for it from your ISP’s router. The same process happens when your computer asks your router for the LAN IP.

![Internet>ISP>Router>PC](http://i.imgur.com/7VygiVE.png "Internet>ISP>Router>PC")

This router passes the request coming from your personal computer to the requested web server (e.g. https://en.wikipedia.org) and then that server sees your router's public IP address as the IP address you are coming from.

Geolocation web services like:
 - https://ipinfo.io/
 - https://www.iplocation.net/
 - http://whatismyipaddress.com/
 - http://www.whatsmyip.org/more-info-about-you/ 
 - and many others
interpret the IP address your router got from your ISP to claim from which country (but also the city and the postcode), organization, or company/ISP you are coming from.

An example:  
Many web services discriminate their users on the basis of their IP addresses. People shouldn't face discrimination.

An example:
![Geolocation info](http://i.imgur.com/cCuIEeB.png "Geolocation info")

Many web services discriminate their users by their IP address (or where they are coming from). People shouldn't face discrimination.

How Jessica lets Logan run
========================

*Logan & Jessica* are tools for friends to help each other by sharing their access to the router with an IP address sitting in the "*right*" country.

If *Jessica* is in Ecuador and *Logan* is in Germany  not being able (as usual) to see Youtube videos because of the restrictive internet access regime in that country *Jessica* will let *Logan* share her Ecuadorian router IP address as his last node before Youtube servers and *Logan* would be able to see the videos as if he was surfing from *Jessica's* room.

If *Jessica* is a student at the wealthy university having access to scientific articles either while sitting in a campus or by running university's VPN she will let *Logan* get access to that repository.

Here is how:

1) Jessica sets up a tunnel for Logan.
--------------------------------------
![1) Jessica sets up a tunnel for Logan.](http://i.imgur.com/jEtCT1a.png "1) Jessica sets up a tunnel for Logan.")
2) Jessica copies the URL for Logan.
------------------------------------
![2) Jessica copies the URL for Logan.](http://i.imgur.com/c8dsvb8.png "2) Jessica copies the URL for Logan.")
3) Jessica sends the URL to Logan.
----------------------------------
Here is the example of the URL to be sent by email, chat or any other available channel:

https://jessica.memoryoftheworld.org/13793/0d0f46e9662743918a6c5980b2f6de6f:2f010b2642c14467882d43fbc9eaee8

4) Logan opens the URL sent by Jessica.
---------------------------------------
![4) Logan opens the URL sent by Jessica.](http://i.imgur.com/rFCTAeK.png "4) Logan opens the URL sent by Jessica.")
5) In extension popup Logan clicks [VIA JESSICA].
-------------------------------------------------
![5) In extension popup Logan clicks [VIA JESSICA].](http://i.imgur.com/IlZwMBX.png "5) In extension popup Logan clicks [VIA JESSICA].")
6) Logan's Chrome extension opens the pinned tab and establishes the tunnel to Jessica.
--------------------------------------------------------------------------------------
![6) Logan's Chrome extension opens the pinned tab and establishes the tunnel to Jessica.](http://i.imgur.com/oUf6nr6.png "6) Logan's Chrome extension opens the pinned tab and establishes the tunnel to Jessica.")
7) From now on Logan's access to the Internet is tunneled through Jessica's computer and IP address.
---------------------------------------------------------------------------------------------
![7) From now on Logan's access to the Internet is tunneled through Jessica's computer and IP address.](http://i.imgur.com/1Anikzb.png "7) From now on Logan's access to the Internet is tunneled through Jessica's computer and IP address.")
8) Jessica gets notification that Logan is running through her tunnel.
----------------------------------------------------------------------
![8) Jessica gets notification that Logan is running through her tunnel.](http://i.imgur.com/nvzSrVh.png "8) Jessica gets notification that Logan is running through her tunnel.")
