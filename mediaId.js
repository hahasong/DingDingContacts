/**
 * mediaId encoder and decoder
 * @usage mediaId.mid2Url('@lADOBIkrgc0E1M0E1A') or mediaId.mid2Url('@lADOBIkrgc0E1M0E1A', {imageSize: "origin"}), mediaId.mid2Url('@lADOBIkrgc0E1M0E1A', {imageSize: "thumb"})
 */
var msgpack = {};
(function(require, module, exports) {
	"use strict";

	function inspect(t) {
		if (void 0 === t) return "undefined";
		var e, r;
		if (t instanceof ArrayBuffer ? (r = "ArrayBuffer", e = new DataView(t)) : t instanceof DataView && (r = "DataView", e = t), !e) return JSON.stringify(t);
		for (var i = [], n = 0; n < t.byteLength; n++) {
			if (n > 20) {
				i.push("...");
				break
			}
			var s = e.getUint8(n).toString(16);
			1 === s.length && (s = "0" + s), i.push(s)
		}
		return "<" + r + " " + i.join(" ") + ">"
	}

	function utf8Write(t, e, r) {
		for (var i = (t.byteLength, 0), n = r.length; n > i; i++) {
			var s = r.charCodeAt(i);
			if (128 > s) t.setUint8(e++, s >>> 0 & 127 | 0);
			else if (2048 > s) t.setUint8(e++, s >>> 6 & 31 | 192), t.setUint8(e++, s >>> 0 & 63 | 128);
			else if (65536 > s) t.setUint8(e++, s >>> 12 & 15 | 224), t.setUint8(e++, s >>> 6 & 63 | 128), t.setUint8(e++, s >>> 0 & 63 | 128);
			else {
				if (!(1114112 > s)) throw new Error("bad codepoint " + s);
				t.setUint8(e++, s >>> 18 & 7 | 240), t.setUint8(e++, s >>> 12 & 63 | 128), t.setUint8(e++, s >>> 6 & 63 | 128), t.setUint8(e++, s >>> 0 & 63 | 128)
			}
		}
	}

	function utf8Read(t, e, r) {
		for (var i = "", n = e, s = e + r; s > n; n++) {
			var f = t.getUint8(n);
			if (0 !== (128 & f))
				if (192 !== (224 & f))
					if (224 !== (240 & f)) {
						if (240 !== (248 & f)) throw new Error("Invalid byte " + f.toString(16));
						var o = (7 & f) << 18 | (63 & t.getUint8(++n)) << 12 | (63 & t.getUint8(++n)) << 6 | (63 & t.getUint8(++n)) << 0,
							u = Math.floor((o - 65536) / 1024) + 55296,
							a = (o - 65536) % 1024 + 56320;
						i += String.fromCharCode(u, a)
					} else i += String.fromCharCode((15 & f) << 12 | (63 & t.getUint8(++n)) << 6 | (63 & t.getUint8(++n)) << 0);
			else i += String.fromCharCode((15 & f) << 6 | 63 & t.getUint8(++n));
			else i += String.fromCharCode(f)
		}
		return i
	}

	function utf8ByteCount(t) {
		for (var e = 0, r = 0, i = t.length; i > r; r++) {
			var n = t.charCodeAt(r);
			if (128 > n) e += 1;
			else if (2048 > n) e += 2;
			else if (65536 > n) e += 3;
			else {
				if (!(1114112 > n)) throw new Error("bad codepoint " + n);
				e += 4
			}
		}
		return e
	}

	function Decoder(t, e, r) {
		this.offset = e || 0, this.view = t, this.bytes = r
	}

	function decode(t) {
		var e = t.buffer,
			r = new DataView(e),
			i = new Decoder(r, 0, t),
			n = i.parse();
		if (i.offset !== e.byteLength) throw new Error(e.byteLength - i.offset + " trailing bytes");
		return n
	}

	function encode(t, e, r) {
		var i = typeof t;
		if ("string" === i) {
			var n = utf8ByteCount(t);
			if (32 > n) return e.setUint8(r, 160 | n), utf8Write(e, r + 1, t), 1 + n;
			if (65536 > n) return e.setUint8(r, 218), e.setUint16(r + 1, n), utf8Write(e, r + 3, t), 3 + n;
			if (4294967296 > n) return e.setUint8(r, 219), e.setUint32(r + 1, n), utf8Write(e, r + 5, t), 5 + n
		}
		if (t instanceof ArrayBuffer) {
			var n = t.byteLength;
			if (65536 > n) return e.setUint8(r, 216), e.setUint16(r + 1, n), new Uint8Array(e.buffer).set(new Uint8Array(t), r + 3), 3 + n;
			if (4294967296 > n) return e.setUint8(r, 217), e.setUint32(r + 1, n), new Uint8Array(e.buffer).set(new Uint8Array(t), r + 5), 5 + n
		}
		if ("number" === i) {
			if (t << 0 !== t) return e.setUint8(r, 203), e.setFloat64(r + 1, t), 9;
			if (t >= 0) {
				if (128 > t) return e.setUint8(r, t), 1;
				if (256 > t) return e.setUint8(r, 204), e.setUint8(r + 1, t), 2;
				if (65536 > t) return e.setUint8(r, 205), e.setUint16(r + 1, t), 3;
				if (4294967296 > t) return e.setUint8(r, 206), e.setUint32(r + 1, t), 5;
				throw new Error("Number too big 0x" + t.toString(16))
			}
			if (t >= -32) return e.setInt8(r, t), 1;
			if (t >= -128) return e.setUint8(r, 208), e.setInt8(r + 1, t), 2;
			if (t >= -32768) return e.setUint8(r, 209), e.setInt16(r + 1, t), 3;
			if (t >= -2147483648) return e.setUint8(r, 210), e.setInt32(r + 1, t), 5;
			throw new Error("Number too small -0x" + (-t).toString(16).substr(1))
		}
		if ("undefined" === i) return e.setUint8(r, 196), 1;
		if (null === t) return e.setUint8(r, 192), 1;
		if ("boolean" === i) return e.setUint8(r, t ? 195 : 194), 1;
		if ("object" === i) {
			var n, s = 0,
				f = Array.isArray(t);
			if (f) n = t.length;
			else {
				var o = Object.keys(t);
				n = o.length
			}
			var s;
			if (16 > n ? (e.setUint8(r, n | (f ? 144 : 128)), s = 1) : 65536 > n ? (e.setUint8(r, f ? 220 : 222), e.setUint16(r + 1, n), s = 3) : 4294967296 > n && (e.setUint8(r, f ? 221 : 223), e.setUint32(r + 1, n), s = 5), f)
				for (var u = 0; n > u; u++) s += encode(t[u], e, r + s);
			else
				for (var u = 0; n > u; u++) {
					var a = o[u];
					s += encode(a, e, r + s), s += encode(t[a], e, r + s)
				}
			return s
		}
		throw new Error("Unknown type " + i)
	}

	function sizeof(t) {
		var e = typeof t;
		if ("string" === e) {
			var r = utf8ByteCount(t);
			if (32 > r) return 1 + r;
			if (65536 > r) return 3 + r;
			if (4294967296 > r) return 5 + r
		}
		if (t instanceof ArrayBuffer) {
			var r = t.byteLength;
			if (65536 > r) return 3 + r;
			if (4294967296 > r) return 5 + r
		}
		if ("number" === e) {
			if (t << 0 !== t) return 9;
			if (t >= 0) {
				if (128 > t) return 1;
				if (256 > t) return 2;
				if (65536 > t) return 3;
				if (4294967296 > t) return 5;
				if (0x10000000000000000 > t) return 9;
				throw new Error("Number too big 0x" + t.toString(16))
			}
			if (t >= -32) return 1;
			if (t >= -128) return 2;
			if (t >= -32768) return 3;
			if (t >= -2147483648) return 5;
			if (t >= -0x8000000000000000) return 9;
			throw new Error("Number too small -0x" + t.toString(16).substr(1))
		}
		if ("boolean" === e || "undefined" === e || null === t) return 1;
		if ("object" === e) {
			var r, i = 0;
			if (Array.isArray(t)) {
				r = t.length;
				for (var n = 0; r > n; n++) i += sizeof(t[n])
			} else {
				var s = Object.keys(t);
				r = s.length;
				for (var n = 0; r > n; n++) {
					var f = s[n];
					i += sizeof(f) + sizeof(t[f])
				}
			}
			if (16 > r) return 1 + i;
			if (65536 > r) return 3 + i;
			if (4294967296 > r) return 5 + i;
			throw new Error("Array or object too long 0x" + r.toString(16))
		}
		throw new Error("Unknown type " + e)
	}
	exports.inspect = inspect, exports.utf8Write = utf8Write, exports.utf8Read = utf8Read, exports.utf8ByteCount = utf8ByteCount, exports.encode = function(t) {
		var e = new ArrayBuffer(sizeof(t)),
			r = new DataView(e);
		return encode(t, r, 0), e
	}, exports.decode = decode, Decoder.prototype.map = function(t) {
		for (var e = {}, r = 0; t > r; r++) {
			var i = this.parse();
			e[i] = this.parse()
		}
		return e
	}, Decoder.prototype.buf = function(t) {
		var e = new ArrayBuffer(t);
		return new Uint8Array(e).set(new Uint8Array(this.view.buffer, this.offset, t), 0), this.offset += t, e
	}, Decoder.prototype.raw = function(t) {
		var e = utf8Read(this.view, this.offset, t);
		return this.offset += t, e
	}, Decoder.prototype.array = function(t) {
		for (var e = new Array(t), r = 0; t > r; r++) e[r] = this.parse();
		return e
	}, Decoder.prototype.parse = function() {
		var t, e, r = this.view.getUint8(this.offset);
		if (160 === (224 & r)) return e = 31 & r, this.offset++, this.raw(e);
		if (128 === (240 & r)) return e = 15 & r, this.offset++, this.map(e);
		if (144 === (240 & r)) return e = 15 & r, this.offset++, this.array(e);
		if (0 === (128 & r)) return this.offset++, r;
		if (224 === (224 & r)) return t = this.view.getInt8(this.offset), this.offset++, t;
		switch (r) {
			case 218:
				return e = this.view.getUint16(this.offset + 1), this.offset += 3, this.raw(e);
			case 219:
				return e = this.view.getUint32(this.offset + 1), this.offset += 5, this.raw(e);
			case 192:
				return this.offset++, null;
			case 194:
				return this.offset++, !1;
			case 195:
				return this.offset++, !0;
			case 196:
				return void this.offset++;
			case 204:
				return t = this.view.getUint8(this.offset + 1), this.offset += 2, t;
			case 205:
				return t = this.view.getUint16(this.offset + 1), this.offset += 3, t;
			case 206:
				return t = this.view.getUint32(this.offset + 1), this.offset += 5, t;
			case 208:
				return t = this.view.getInt8(this.offset + 1), this.offset += 2, t;
			case 209:
				return t = this.view.getInt16(this.offset + 1), this.offset += 3, t;
			case 210:
				return t = this.view.getInt32(this.offset + 1), this.offset += 5, t;
			case 222:
				return e = this.view.getUint16(this.offset + 1), this.offset += 3, this.map(e);
			case 223:
				return e = this.view.getUint32(this.offset + 1), this.offset += 5, this.map(e);
			case 220:
				return e = this.view.getUint16(this.offset + 1), this.offset += 3, this.array(e);
			case 221:
				return e = this.view.getUint32(this.offset + 1), this.offset += 5, this.array(e);
			case 216:
				return e = this.view.getUint16(this.offset + 1), this.offset += 3, this.buf(e);
			case 217:
				return e = this.view.getUint32(this.offset + 1), this.offset += 5, this.buf(e);
			case 202:
				return t = this.view.getFloat32(this.offset + 1), this.offset += 5, t;
			case 203:
				return t = this.view.getFloat64(this.offset + 1), this.offset += 9, t;
			case 207:
				var i = this.bytes;
				this.offset++;
				var n = 16777216 * i[this.offset++] + (i[this.offset++] << 16) + (i[this.offset++] << 8) + i[this.offset++];
				return 4294967296 * n + 16777216 * i[this.offset++] + (i[this.offset++] << 16) + (i[this.offset++] << 8) + i[this.offset++]
		}
		throw new Error("Unknown type 0x" + r.toString(16))
	}, exports.decodeFromB64 = function(t) {
		for (var e = window.atob(t), r = e.length, i = new Uint8Array(r), n = 0; r > n; n++) {
			var s = e.charCodeAt(n);
			i[n] = s
		}
		return exports.decode(i)
	};

	msgpack = exports;
})(null, null, {});

var fileTypes = {};
(function(require, module, exports) {
	var TYPE_IDS = {},
		ID_CATE_TYPES = {
			0: "IMAGE_JPG",
			1: "IMAGE_GIF",
			2: "IMAGE_PNG",
			3: "IMAGE_BMP",
			4: "AUDIO_AMR",
			5: "AUDIO_MP3",
			6: "VIDEO_MP4",
			7: "AUDIO_WAV",
			8: "NORMAL_FILE",
			9: "OFFICE_DOC",
			10: "OFFICE_DOCX",
			11: "OFFICE_XLS",
			12: "OFFICE_XLSX",
			13: "OFFICE_PPT",
			14: "OFFICE_PPTX",
			15: "NORMAL_ZIP",
			16: "NORMAL_PDF",
			17: "NORMAL_RAR",
			18: "NORMAL_PSD",
			19: "NORMAL_AI",
			20: "NORMAL_TXT",
			21: "VIDEO_AVI",
			22: "VIDEO_RMVB",
			23: "VIDEO_RM",
			24: "VIDEO_MPG",
			25: "VIDEO_WMV",
			26: "VIDEO_MKV",
			27: "VIDEO_VOB",
			28: "NORMAL_TFSPRIVATE",
			29: "IMAGE_WEBP"
		};
	Object.keys(ID_CATE_TYPES).forEach(function(e) {
		var _ = ID_CATE_TYPES[e],
			I = _.split("_")[1].toLowerCase();
		TYPE_IDS[I] = e
	}), TYPE_IDS.jpeg = 0;
	var VALID_TYPES = ["jpg", "jpeg", "bmp", "png", "gif", "doc", "docx", "xlsx", "xls", "pdf", "ppt", "pptx", "zip", "rar", "txt", "mp4", "psd", "ai", "avi"],
		typeFuncs = {
			getTypeByName: function(e) {
				return e.split(".").pop().toLowerCase()
			},
			getIdByType: function(e) {
				if (void 0 === TYPE_IDS[e]) var e = "file";
				return TYPE_IDS[e]
			},
			getCateTypeById: function(e) {
				if (void 0 === ID_CATE_TYPES[e]) var e = "8";
				return ID_CATE_TYPES[e]
			},
			getTypeById: function(e) {
				if (void 0 === ID_CATE_TYPES[e]) var e = "8";
				return ID_CATE_TYPES[e].split("_")[1].toLowerCase()
			},
			getCateTypeByType: function(e) {
				return typeFuncs.getCateTypeById(typeFuncs.getIdByType(e))
			},
			isValid: function(e) {
				var _ = VALID_TYPES.indexOf(e);
				return -1 !== _
			},
			isImg: function(e) {
				return "IMAGE" === typeFuncs.getCateTypeByType(e).split("_")[0]
			},
			getFileIconByType: function(e) {
				var _ = typeFuncs.getCateTypeByType(e);
				switch (_) {
					case "OFFICE_DOC":
					case "OFFICE_DOCX":
						return "word-icon";
					case "OFFICE_PPT":
					case "OFFICE_PPTX":
						return "ppt-icon";
					case "NORMAL_PDF":
						return "pdf-icon";
					case "OFFICE_XLS":
					case "OFFICE_XLSX":
						return "excl-icon";
					case "NORMAL_ZIP":
						return "zip-icon";
					case "NORMAL_RAR":
						return "rar-icon";
					case "NORMAL_PSD":
						return "psd-icon";
					case "NORMAL_AI":
						return "ai-icon";
					case "NORMAL_TXT":
						return "txt-icon";
					case "VIDEO_AVI":
					case "VIDEO_RMVB":
					case "VIDEO_RM":
					case "VIDEO_MPG":
					case "VIDEO_WMV":
					case "VIDEO_MKV":
					case "VIDEO_VOB":
					case "VIDEO_MP4":
						return "video-icon";
					case "IMAGE_JPG":
					case "IMAGE_GIF":
					case "IMAGE_PNG":
					case "IMAGE_BMP":
						return "pic-icon";
					default:
						return "default-icon"
				}
			}
		};
	fileTypes = typeFuncs;

})();

var mediaId = {};
(function(require, module, exports) {
	"use strict";

	function reverseString(e) {
		for (var i = "", r = e.length - 1; r >= 0; r--) i += e[r];
		return i
	}

	//var msgpack = msgpack,
	//	fileTypes = fileTypes,
	//	Uri = Uri,
	var	mediaIdHost = "static.dingtalk.com",
		oldMediaIdHost = "i01.lw.aliimg.com",
		mediaIdDir = "media",
		BASEURL = "https://" + mediaIdHost + "/" + mediaIdDir + "/",
		isNoRetina = 1 === window.devicePixelRatio,
		mid2Url = function(e, i) {
			var i = i || {};
			if ("@" !== e.charAt(0)) return "https:" === window.location.protocol && (e = e.replace(/^http(?!s)/, "https")), e;
			e = e.replace(/-/gi, "+").replace(/_/gi, "/");
			var e = e.substr(1),
				r = msgpack.decodeFromB64(e),
				t = fileTypes.getCateTypeById(r[0]).split("_");
			if ("IMAGE" === t[0])
				if ("origin" === i.imageSize) var a = e + "_" + r[3] + "_" + r[2] + "." + t[1].toLowerCase();
				else if ("thumb" === i.imageSize) var s = isNoRetina ? "_60x60q90.jpg" : "_120x120q90.jpg",
				a = e + "_" + r[3] + "_" + r[2] + "." + t[1].toLowerCase() + s;
			else if ("GIF" === t[1]) var a = e + "_" + r[3] + "_" + r[2] + "." + t[1].toLowerCase();
			else var a = e + "_" + r[3] + "_" + r[2] + "." + t[1].toLowerCase() + "_620x10000q90.jpg";
			else var a = e + "." + t[1].toLowerCase();
			return a = a.replace(/\//gi, "_").replace(/\+/gi, "-"), BASEURL + a
		},
		url2Mid = function(e) {
			var i = new Uri(e);
			if ((i.host() === mediaIdHost || i.host() === oldMediaIdHost) && i.uriParts.directory === "/" + mediaIdDir + "/") {
				var r = i.uriParts.file,
					t = r.indexOf(".");
				if (-1 !== t) {
					r = r.slice(0, t), r = reverseString(r);
					var a = r.indexOf("_");
					if (-1 !== a) {
						var s = r.indexOf("_", a + 1);
						if (-1 !== s && (r = r.slice(s + 1))) return "@" + reverseString(r)
					}
				}
			}
			return e
		};
	mediaId.mid2Url = mid2Url, mediaId.url2Mid = url2Mid;

})();

var Uri = function() {};
(function(require, module, exports) {
	! function(t) {
		function r(t) {
			return t && (t = t.toString().replace(o.pluses, "%20"), t = decodeURIComponent(t)), t
		}

		function e(t) {
			var r = o.uri_parser,
				e = ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "isColonUri", "relative", "path", "directory", "file", "query", "anchor"],
				i = r.exec(t || ""),
				s = {};
			return e.forEach(function(t, r) {
				s[t] = i[r] || ""
			}), s
		}

		function i(t) {
			var e, i, s, n, h, u, a, f = [];
			if ("undefined" == typeof t || null === t || "" === t) return f;
			for (0 === t.indexOf("?") && (t = t.substring(1)), i = t.toString().split(o.query_separator), e = 0, a = i.length; a > e; e++) s = i[e], n = s.indexOf("="), 0 !== n && (h = r(s.substring(0, n)), u = r(s.substring(n + 1)), f.push(-1 === n ? [s, null] : [h, u]));
			return f
		}

		function s(t) {
			this.uriParts = e(t), this.queryPairs = i(this.uriParts.query), this.hasAuthorityPrefixUserPref = null
		}
		var o = {
			starts_with_slashes: /^\/+/,
			ends_with_slashes: /\/+$/,
			pluses: /\+/g,
			query_separator: /[&;]/,
			uri_parser: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@\/]*)(?::([^:@]*))?)?@)?(\[[0-9a-fA-F:.]+\]|[^:\/?#]*)(?::(\d+|(?=:)))?(:)?)((((?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
		};
		Array.prototype.forEach || (Array.prototype.forEach = function(t, r) {
			var e, i;
			if (null == this) throw new TypeError(" this is null or not defined");
			var s = Object(this),
				o = s.length >>> 0;
			if ("function" != typeof t) throw new TypeError(t + " is not a function");
			for (arguments.length > 1 && (e = r), i = 0; o > i;) {
				var n;
				i in s && (n = s[i], t.call(e, n, i, s)), i++
			}
		}), ["protocol", "userInfo", "host", "port", "path", "anchor"].forEach(function(t) {
			s.prototype[t] = function(r) {
				return "undefined" != typeof r && (this.uriParts[t] = r), this.uriParts[t]
			}
		}), s.prototype.hasAuthorityPrefix = function(t) {
			return "undefined" != typeof t && (this.hasAuthorityPrefixUserPref = t), null === this.hasAuthorityPrefixUserPref ? -1 !== this.uriParts.source.indexOf("//") : this.hasAuthorityPrefixUserPref
		}, s.prototype.isColonUri = function(t) {
			return "undefined" == typeof t ? !!this.uriParts.isColonUri : void(this.uriParts.isColonUri = !!t)
		}, s.prototype.query = function(t) {
			var r, e, s, o = "";
			for ("undefined" != typeof t && (this.queryPairs = i(t)), r = 0, s = this.queryPairs.length; s > r; r++) e = this.queryPairs[r], o.length > 0 && (o += "&"), null === e[1] ? o += e[0] : (o += e[0], o += "=", "undefined" != typeof e[1] && (o += encodeURIComponent(e[1])));
			return o.length > 0 ? "?" + o : o
		}, s.prototype.getQueryParamValue = function(t) {
			var r, e, i;
			for (e = 0, i = this.queryPairs.length; i > e; e++)
				if (r = this.queryPairs[e], t === r[0]) return r[1]
		}, s.prototype.getQueryParamValues = function(t) {
			var r, e, i, s = [];
			for (r = 0, i = this.queryPairs.length; i > r; r++) e = this.queryPairs[r], t === e[0] && s.push(e[1]);
			return s
		}, s.prototype.deleteQueryParam = function(t, e) {
			var i, s, o, n, h, u = [];
			for (i = 0, h = this.queryPairs.length; h > i; i++) s = this.queryPairs[i], o = r(s[0]) === r(t), n = s[1] === e, (1 !== arguments.length || o) && (2 !== arguments.length || o && n) || u.push(s);
			return this.queryPairs = u, this
		}, s.prototype.addQueryParam = function(t, r, e) {
			return 3 === arguments.length && -1 !== e ? (e = Math.min(e, this.queryPairs.length), this.queryPairs.splice(e, 0, [t, r])) : arguments.length > 0 && this.queryPairs.push([t, r]), this
		}, s.prototype.hasQueryParam = function(t) {
			var r, e = this.queryPairs.length;
			for (r = 0; e > r; r++)
				if (this.queryPairs[r][0] == t) return !0;
			return !1
		}, s.prototype.replaceQueryParam = function(t, e, i) {
			var s, o, n = -1,
				h = this.queryPairs.length;
			if (3 === arguments.length) {
				for (s = 0; h > s; s++)
					if (o = this.queryPairs[s], r(o[0]) === r(t) && decodeURIComponent(o[1]) === r(i)) {
						n = s;
						break
					}
				n >= 0 && this.deleteQueryParam(t, r(i)).addQueryParam(t, e, n)
			} else {
				for (s = 0; h > s; s++)
					if (o = this.queryPairs[s], r(o[0]) === r(t)) {
						n = s;
						break
					}
				this.deleteQueryParam(t), this.addQueryParam(t, e, n)
			}
			return this
		}, ["protocol", "hasAuthorityPrefix", "isColonUri", "userInfo", "host", "port", "path", "query", "anchor"].forEach(function(t) {
			var r = "set" + t.charAt(0).toUpperCase() + t.slice(1);
			s.prototype[r] = function(r) {
				return this[t](r), this
			}
		}), s.prototype.scheme = function() {
			var t = "";
			return this.protocol() ? (t += this.protocol(), this.protocol().indexOf(":") !== this.protocol().length - 1 && (t += ":"), t += "//") : this.hasAuthorityPrefix() && this.host() && (t += "//"), t
		}, s.prototype.origin = function() {
			var t = this.scheme();
			return this.userInfo() && this.host() && (t += this.userInfo(), this.userInfo().indexOf("@") !== this.userInfo().length - 1 && (t += "@")), this.host() && (t += this.host(), (this.port() || this.path() && this.path().substr(0, 1).match(/[0-9]/)) && (t += ":" + this.port())), t
		}, s.prototype.addTrailingSlash = function() {
			var t = this.path() || "";
			return "/" !== t.substr(-1) && this.path(t + "/"), this
		}, s.prototype.toString = function() {
			var t, r = this.origin();
			return this.isColonUri() ? this.path() && (r += ":" + this.path()) : this.path() ? (t = this.path(), o.ends_with_slashes.test(r) || o.starts_with_slashes.test(t) ? (r && r.replace(o.ends_with_slashes, "/"), t = t.replace(o.starts_with_slashes, "/")) : r += "/", r += t) : this.host() && (this.query().toString() || this.anchor()) && (r += "/"), this.query().toString() && (r += this.query().toString()), this.anchor() && (0 !== this.anchor().indexOf("#") && (r += "#"), r += this.anchor()), r
		}, s.prototype.clone = function() {
			return new s(this.toString())
		}, "function" == typeof define && define.amd ? define(function() {
			return s
		}) : "undefined" != typeof module && "undefined" != typeof module.exports ? module.exports = s : Uri = s
	}(this);

})();