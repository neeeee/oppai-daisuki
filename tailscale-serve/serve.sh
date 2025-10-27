#!/bin/bash
tailscale serve --bg --https=443 --set-path=/ http://localhost:3000
