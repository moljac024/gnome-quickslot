//go:build !cgo

package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"

	"github.com/godbus/dbus/v5"
)

const (
	busName = "com.github.moljac024.quickslot"
	objPath = dbus.ObjectPath("/com/github/moljac024/quickslot")
	iface   = "com.github.moljac024.quickslot"
	version = "0.1.0"
)

func main() {
	var id string
	var slot int
	var listFavs bool
	var showVersion bool

	flag.StringVar(&id, "id", "", "Desktop ID, e.g. org.gnome.Nautilus.desktop")
	flag.IntVar(&slot, "slot", 0, "Dock slot (1-based)")
	flag.BoolVar(&listFavs, "list-favorites", false, "List favorite desktop IDs")
	flag.BoolVar(&showVersion, "version", false, "Print version and exit")
	flag.Parse()

	if showVersion {
		fmt.Println(version)
		return
	}

	modes := 0
	if id != "" {
		modes++
	}
	if slot > 0 {
		modes++
	}
	if listFavs {
		modes++
	}
	if modes != 1 {
		die("Choose exactly one: --id, --slot, or --list-favorites")
	}

	conn, err := dbus.ConnectSessionBus()
	if err != nil {
		die("DBus connect: %v", err)
	}
	defer conn.Close()

	obj := conn.Object(busName, objPath)

	switch {
	case id != "":
		var ok bool
		if err := obj.Call(iface+".RunOrRaiseById", 0, id).Store(&ok); err != nil {
			die("DBus error: %v", err)
		}
		if !ok {
			die("No app for %s", id)
		}

	case slot > 0:
		var ok bool
		if err := obj.Call(iface+".RunOrRaiseBySlot", 0, int32(slot)).Store(&ok); err != nil {
			die("DBus error: %v", err)
		}
		if !ok {
			die("Slot %d failed (out of range or missing app)", slot)
		}

	case listFavs:
		var favs []string
		if err := obj.Call(iface+".ListFavorites", 0).Store(&favs); err != nil {
			die("DBus error: %v", err)
		}
		enc := json.NewEncoder(os.Stdout)
		enc.SetEscapeHTML(false)
		for _, f := range favs {
			fmt.Println(f)
		}
	}
}

func die(fmtStr string, a ...any) {
	fmt.Fprintf(os.Stderr, fmtStr+"\n", a...)
	os.Exit(1)
}
